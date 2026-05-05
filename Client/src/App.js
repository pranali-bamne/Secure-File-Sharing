import React, { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState("");
  const [link, setLink] = useState("");
  const [progress, setProgress] = useState(0);
  const [dark, setDark] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🔐 Strong password checker
  const checkStrength = (pass) => {
    const strongRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!pass) {
      setStrength("");
      return;
    }

    if (strongRegex.test(pass)) {
      setStrength("Strong 🟢");
    } else {
      setStrength("Not Strong ❌");
    }
  };

  // 📋 Copy link
  const copyToClipboard = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 📤 Upload
  const handleUpload = async () => {
    if (isUploaded) return;

    if (!file || !password) {
      alert("Select file and enter password");
      return;
    }

    if (strength !== "Strong 🟢") {
      alert("Enter a strong password");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("password", password);

    try {
      const res = await axios.post(
        "http://localhost:5000/upload",
        formData,
        {
          onUploadProgress: (data) => {
            setProgress(Math.round((data.loaded / data.total) * 100));
          },
        }
      );

      setLink(res.data.link);
      setIsUploaded(true);
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    }
  };

  // 📁 File icon
  const getFileIcon = () => {
    if (!file) return "📁";
    const type = file.name.split(".").pop();

    if (["png", "jpg", "jpeg"].includes(type)) return "🖼️";
    if (["pdf"].includes(type)) return "📄";
    if (["zip"].includes(type)) return "🗜️";
    return "📁";
  };

  return (
    <div className={dark ? "dark" : ""}>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition duration-500 px-4">

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-6 w-full max-w-md text-center">

          {/* 🌙 Dark Mode */}
          <button
            onClick={() => setDark(!dark)}
            className="mb-4 text-sm text-gray-500 dark:text-gray-300"
          >
            {dark ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Secure File Sharing 🔐
          </h2>

          <p className="text-gray-500 dark:text-gray-300 text-sm mb-4">
            Upload files securely with encryption & password protection
          </p>

          {/* File Icon */}
          <div className="text-5xl mb-3">{getFileIcon()}</div>

          {/* File Input */}
          <input
            type="file"
            onChange={(e) => {
              setFile(e.target.files[0]);
              setIsUploaded(false);
              setLink("");
              setProgress(0);
            }}
            className="mb-4 w-full"
          />

          {/* 🔐 Password + Eye */}
          <div className="relative mb-2">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter strong password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                checkStrength(e.target.value);
              }}
              className="w-full p-2 pr-10 rounded-lg border dark:bg-gray-700 dark:text-white"
            />

            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 cursor-pointer text-gray-500"
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          {/* Strength */}
          {strength && (
            <p
              className={`text-sm mb-3 ${
                strength === "Strong 🟢"
                  ? "text-green-600"
                  : "text-red-500"
              }`}
            >
              {strength}
            </p>
          )}

          {/* 🚀 Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isUploaded || strength !== "Strong 🟢"}
            className={`w-full py-2 rounded-lg text-white font-semibold transition
              ${
                isUploaded || strength !== "Strong 🟢"
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-95"
              }
            `}
          >
            {isUploaded ? "Uploaded ✅" : "Upload File 🚀"}
          </button>

          {/* 📊 Progress */}
          {progress > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 text-xs text-white text-center p-1"
                  style={{ width: `${progress}%` }}
                >
                  {progress}%
                </div>
              </div>
            </div>
          )}

          {/* 🔗 Link */}
          {link && (
            <div className="mt-5 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-green-600 mb-2">Upload Successful ✅</p>

              <div className="flex items-center gap-2">
                <input
                  value={link}
                  readOnly
                  className="flex-1 p-2 rounded border text-sm dark:bg-gray-800 dark:text-white"
                />

                <button
                  onClick={copyToClipboard}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;