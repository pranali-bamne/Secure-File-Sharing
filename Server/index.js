require("dotenv").config();
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));

let files = {};

const algorithm = "aes-256-cbc";
const key = Buffer.from(process.env.SECRET_KEY);
const iv = Buffer.from(process.env.IV);

// 📁 Storage (FIXED: allow all files)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    cb(null, true); // ✅ allow all files
  }
});

// 🔐 Encrypt
function encryptFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    fs.createReadStream(inputPath)
      .pipe(cipher)
      .pipe(fs.createWriteStream(outputPath))
      .on("finish", resolve)
      .on("error", reject);
  });
}

// 🔓 Decrypt
function decryptFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    fs.createReadStream(inputPath)
      .pipe(decipher)
      .pipe(fs.createWriteStream(outputPath))
      .on("finish", resolve)
      .on("error", reject);
  });
}

// 🎨 Download Page UI
function getDownloadPage(fileId, expiresAt, errorMessage = "") {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Secure Download</title>
    <style>
      body {
        margin: 0;
        font-family: Arial;
        background: linear-gradient(135deg, #667eea, #764ba2);
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .card {
        background: white;
        padding: 30px;
        border-radius: 15px;
        width: 320px;
        text-align: center;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      }
      input {
        width: 100%;
        padding: 10px;
        margin-bottom: 15px;
        border-radius: 8px;
        border: 1px solid #ccc;
      }
      button {
        width: 100%;
        padding: 10px;
        border: none;
        border-radius: 8px;
        background: #667eea;
        color: white;
        font-weight: bold;
        cursor: pointer;
      }
      .error {
        color: red;
        margin-top: 10px;
      }
    </style>
  </head>

  <body>
    <div class="card">
      <h2>🔐 Secure File Access</h2>

      <form method="POST" action="/download/${fileId}" onsubmit="handleSubmit()">
        <input type="password" name="password" placeholder="Enter Password" required />
        <button type="submit">Download File</button>
      </form>

      <p id="timer"></p>
      ${errorMessage ? `<div class="error">${errorMessage}</div>` : ""}

    </div>

    <script>
      const expiry = ${expiresAt};

      function handleSubmit() {
        const btn = document.querySelector("button");
        btn.disabled = true;
        btn.innerText = "Downloading...";
        
        setTimeout(() => {
          btn.innerText = "Downloaded ✅";
        }, 1500);
      }

      setInterval(() => {
        const remaining = expiry - Date.now();

        if (remaining <= 0) {
          document.getElementById("timer").innerText = "Link expired ⏳";
          return;
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);

        document.getElementById("timer").innerText =
          "Expires in: " + minutes + "m " + seconds + "s";
      }, 1000);
    </script>
  </body>
  </html>
  `;
}

// 📤 Upload
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const password = req.body.password;

    if (!req.file || !password) {
      return res.status(400).json({ message: "File & password required" });
    }

    // 🔐 Strong password check
    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!strongPassword.test(password)) {
      return res.status(400).json({
        message:
          "Password must be 8+ chars with uppercase, lowercase, number & special character"
      });
    }

    const fileId = Math.random().toString(36).substring(2, 8);

    const originalPath = path.join(__dirname, "uploads", req.file.filename);
    const encryptedPath = originalPath + ".enc";

    await encryptFile(originalPath, encryptedPath);
    fs.unlinkSync(originalPath);

    const hashedPassword = await bcrypt.hash(password, 10);

    const expiresAt = Date.now() + 60 * 60 * 1000;

    files[fileId] = {
      path: encryptedPath,
      password: hashedPassword,
      expiresAt
    };

    res.json({
      link: `http://localhost:5000/download/${fileId}`,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// 🔑 Show UI
app.get("/download/:id", (req, res) => {
  const fileId = req.params.id;
  const fileData = files[fileId];

  if (!fileData) {
    return res.send("<h2>Link expired or file not found ❌</h2>");
  }

  if (Date.now() > fileData.expiresAt) {
    delete files[fileId];
    return res.send("<h2>Link expired ⏳</h2>");
  }

  res.send(getDownloadPage(fileId, fileData.expiresAt));
});

// 🔓 Download
app.post("/download/:id", async (req, res) => {
  const fileId = req.params.id;
  const fileData = files[fileId];

  if (!fileData) {
    return res.send("<h2>Link expired or file not found ❌</h2>");
  }

  if (Date.now() > fileData.expiresAt) {
    delete files[fileId];
    return res.send("<h2>Link expired ⏳</h2>");
  }

  const isMatch = await bcrypt.compare(req.body.password, fileData.password);

  if (!isMatch) {
    return res.send(getDownloadPage(fileId, fileData.expiresAt, "Wrong password ❌"));
  }

  delete files[fileId];

  const encryptedPath = fileData.path;
  const decryptedPath = encryptedPath.replace(".enc", "");

  try {
    await decryptFile(encryptedPath, decryptedPath);

    res.download(decryptedPath, () => {
      try {
        fs.unlinkSync(decryptedPath);
      } catch (err) {
        console.error(err);
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing file");
  }
});

// 🧹 Cleanup
setInterval(() => {
  const now = Date.now();

  for (let fileId in files) {
    if (now > files[fileId].expiresAt) {
      try {
        fs.unlinkSync(files[fileId].path);
      } catch (err) {}

      delete files[fileId];
      console.log("Expired file deleted:", fileId);
    }
  }
}, 5 * 60 * 1000);

// Test
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});