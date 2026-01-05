require("dotenv").config();
const mongoose = require("mongoose");
const Post = require("./models/Post");

async function run() {
  try {
    const uri =
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chothuenha";
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("🔍 Đang tìm các bài viết cũ không có district/rentalModel...");

    // Cập nhật tất cả bài viết không có district hoặc rentalModel
    const result = await Post.updateMany(
      {
        $or: [
          { district: { $exists: false } },
          { rentalModel: { $exists: false } },
          { district: null },
          { rentalModel: null },
        ],
      },
      {
        $set: {
          district: "Chưa cập nhật",
          rentalModel: "Nhà Đất cho thuê",
        },
      }
    );

    console.log("✅ Đã cập nhật:", result.modifiedCount, "bài viết");

    // Hiển thị các bài viết hiện tại
    const posts = await Post.find().select("title district rentalModel");
    console.log("\n📋 Danh sách bài viết:");
    posts.forEach((p, i) => {
      console.log(
        `${i + 1}. ${p.title} | Quận: ${p.district} | Mô hình: ${p.rentalModel}`
      );
    });

    await mongoose.disconnect();
    console.log("\n✅ Hoàn thành!");
  } catch (err) {
    console.error("❌ Lỗi:", err);
    process.exitCode = 1;
  }
}

run();
