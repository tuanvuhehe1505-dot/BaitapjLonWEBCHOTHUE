// Load biến môi trường
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ===== DEBUG (có thể xóa sau khi ổn định) =====
console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("PORT:", process.env.PORT);
// =============================================

// ===== KẾT NỐI MONGODB LOCAL =====
mongoose
  .connect("mongodb://127.0.0.1:27017/chothuenha")
  .then(() => console.log("✅ Đã kết nối Database (MongoDB local)"))
  .catch((err) => console.error("❌ Lỗi kết nối DB:", err));

// ===== ROUTES =====
app.use("/api/auth", require("./routes/auth"));
app.use("/api/posts", require("./routes/posts"));

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== HEALTH CHECK =====
app.get("/api/ping", (req, res) => {
  res.json({
    ok: true,
    time: new Date().toISOString(),
  });
});

// ===== ROOT =====
app.get("/", (req, res) => {
  res.send("Backend ChoThueNha.com đang chạy!");
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Backend chạy tại http://localhost:${PORT}`);
  console.log("👉 Mở frontend bằng Live Server để test");
});
