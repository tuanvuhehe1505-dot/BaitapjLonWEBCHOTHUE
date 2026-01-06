// Script để xóa tất cả users
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function deleteAllUsers() {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chothuenha";

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Đã kết nối Database");

    // Xóa tất cả users
    const result = await User.deleteMany({});

    console.log("═══════════════════════════════════════════");
    console.log("✅ XÓA THÀNH CÔNG!");
    console.log("═══════════════════════════════════════════");
    console.log(`📊 Số users đã xóa: ${result.deletedCount}`);
    console.log("═══════════════════════════════════════════\n");

    console.log("🔄 Bây giờ bạn có thể đăng ký lại tài khoản admin mới!");
    console.log("🔐 Admin Code: dat1505");
    console.log("📞 SĐT: 0344886556");
    console.log("🔑 Mật khẩu: 123456");

    await mongoose.disconnect();
    console.log("\n✅ Đã ngắt kết nối database");
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
    process.exit(1);
  }
}

deleteAllUsers();
