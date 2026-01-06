// Script để fix role admin cho user hiện tại
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function fixAdminRole() {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chothuenha";

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Đã kết nối Database");

    // Cập nhật role cho user 0344886556
    const result = await User.findOneAndUpdate(
      { phone: "0344886556" },
      { role: "admin" },
      { new: true }
    );

    if (result) {
      console.log("✅ Cập nhật thành công!");
      console.log("User:", result);
    } else {
      console.log("❌ Không tìm thấy user với số 0344886556");
      console.log("Danh sách tất cả users:");
      const allUsers = await User.find({}, { phone: 1, name: 1, role: 1 });
      console.log(allUsers);
    }

    await mongoose.disconnect();
    console.log("Đã ngắt kết nối database");
  } catch (error) {
    console.error("❌ Lỗi:", error.message);
    process.exit(1);
  }
}

fixAdminRole();
