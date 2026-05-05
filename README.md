# 🔐 Secure File Sharing System

A secure file sharing web app with encryption, password protection, and auto-expiring download links.

---

## 🚀 Features

- AES-256 file encryption
- Password protection (bcrypt hashing)
- One-time download links
- Link expires after 1 hour
- Auto deletion of files after download
- File type validation (PNG, JPG, PDF, ZIP)

---

## 📁 Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-username/secure-file-sharing.git
cd secure-file-sharing
```

---

### 2. Backend Setup

```bash
cd server
npm install
```

Create `.env` file inside `server` folder:

```
SECRET_KEY=your_32_byte_secret_key_here
IV=your_16_byte_iv_here
```
Create `uploads` folder Inside the `server` folder:
```bash
mkdir uploads
```
👉 This folder is used to temporarily store uploaded files

Run backend:

```bash
node index.js
```

---

### 3. Frontend Setup

```bash
cd client
npm install
npm start
```

---

## 🔐 How It Works

1. User uploads file with password  
2. File is encrypted using AES-256  
3. Password is hashed using bcrypt  
4. Unique download link is generated  
5. Link expires after 1 hour or after one download  
6. File is decrypted only during download  
7. After download, file is deleted  

---

## 🔒 Security Features

- AES-256 encryption  
- bcrypt password hashing  
- One-time secure links  
- Auto-expiry system  
- Auto cleanup of files  

---

## 👩‍💻 Author

Pranali Bamne  

---

## 📜 License

This project is for educational purposes.
