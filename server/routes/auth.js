const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authenticateToken = require("../middleware/auth");

// ======================= ĐĂNG KÝ =======================
router.post("/register", async (req, res) => {
  const { name, phone, password, adminCode } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
  }

  try {
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Số điện thoại đã được đăng ký" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const role =
      adminCode &&
      process.env.ADMIN_REG_CODE &&
      adminCode === process.env.ADMIN_REG_CODE
        ? "admin"
        : "user";

    const user = new User({
      name,
      phone,
      password: hashedPassword,
      role,
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Đăng ký thành công",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Register Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ======================= ĐĂNG NHẬP =======================
router.post("/login", async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res
      .status(400)
      .json({ message: "Vui lòng nhập số điện thoại và mật khẩu" });
  }

  try {
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Mật khẩu không chính xác" });
    }

    const token = jwt.sign(
      { id: user._id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ======================= BƯỚC 1: GỬI OTP =======================
router.post("/send-otp", async (req, res) => {
  console.log("📌 POST /send-otp được gọi");
  console.log("Body nhận:", req.body);

  const { phone } = req.body;

  if (!phone) {
    console.log("❌ Không có phone trong request");
    return res.status(400).json({ message: "Vui lòng nhập số điện thoại" });
  }

  try {
    // Tìm user
    const user = await User.findOne({ phone });
    console.log("🔍 Tìm user với phone:", phone);
    console.log("📊 User tìm được:", user);

    if (!user) {
      console.log("❌ Không tìm thấy user");
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    // TẠO OTP NGẪU NHIÊN (6 chữ số)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút

    // LƯU OTP VÀO DATABASE
    user.resetOTP = otp;
    user.resetOTPExpiry = otpExpiry;
    await user.save();

    // HIỂN THỊ OTP TRONG CONSOLE (CHỈ CHO GIẢNG VIÊN THẤY)
    console.log("═══════════════════════════════════════════");
    console.log("📌 OTP TẠO THÀNH CÔNG - GIẢNG VIÊN XEM");
    console.log("═══════════════════════════════════════════");
    console.log(`👤 Tên: ${user.name}`);
    console.log(`📱 SĐT: ${user.phone}`);
    console.log(`🔐 Mã OTP: ${otp}`);
    console.log(`⏰ Hết hạn lúc: ${otpExpiry.toLocaleString("vi-VN")}`);
    console.log(`⏳ Còn hiệu lực: 5 phút`);
    console.log("═══════════════════════════════════════════\n");

    res.json({
      message: "OTP đã được gửi. Kiểm tra console server để xem mã OTP",
    });
  } catch (error) {
    console.error("❌ Send OTP Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ======================= BƯỚC 2: KIỂM TRA OTP & ĐỔI MẬT KHẨU =======================
router.post("/verify-otp-and-reset", async (req, res) => {
  console.log("📌 POST /verify-otp-and-reset được gọi");
  console.log("Body nhận:", req.body);

  const { phone, otp, newPassword } = req.body;

  if (!phone || !otp || !newPassword) {
    return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin" });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
  }

  try {
    // Tìm user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    // KIỂM TRA OTP
    if (!user.resetOTP || user.resetOTP !== otp) {
      console.log(
        `❌ OTP sai! User: ${user.phone}, OTP nhập: ${otp}, OTP lưu: ${user.resetOTP}`
      );
      return res.status(400).json({ message: "Mã OTP không chính xác" });
    }

    // KIỂM TRA OTP CÓ HỀT HẠN KHÔNG
    if (new Date() > user.resetOTPExpiry) {
      console.log(`⏰ OTP hết hạn! User: ${user.phone}`);
      return res.status(400).json({ message: "Mã OTP đã hết hạn" });
    }

    // CẬP NHẬT MẬT KHẨU MỚI
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOTP = null;
    user.resetOTPExpiry = null;
    await user.save();

    console.log("═══════════════════════════════════════════");
    console.log("✅ ĐỔI MẬT KHẨU THÀNH CÔNG");
    console.log("═══════════════════════════════════════════");
    console.log(`👤 Tên: ${user.name}`);
    console.log(`📱 SĐT: ${user.phone}`);
    console.log(`⏰ Thời gian: ${new Date().toLocaleString("vi-VN")}`);
    console.log("═══════════════════════════════════════════\n");

    res.json({ message: "Đặt lại mật khẩu thành công!" });
  } catch (error) {
    console.error("❌ Verify OTP Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// thêm endpoint kiểm tra token (nếu cần gọi từ frontend để giữ session)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name phone role createdAt"
    );
    if (!user)
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    res.json({ user });
  } catch (error) {
    console.error("❌ /me Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
