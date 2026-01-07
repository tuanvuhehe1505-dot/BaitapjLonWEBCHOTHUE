const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const path = require("path");
const fs = require("fs");

// ✅ IMPORT MIDDLEWARE XÁC THỰC
const authenticateToken = require("../middleware/auth");

// ======================= CLOUDINARY SETUP =======================
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Cấu hình Cloudinary từ environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage cho multer
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "chothuenha", // Folder trên Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [{ width: 1200, height: 900, crop: "limit" }], // Resize ảnh
  },
});

// Fallback: Local storage nếu không có Cloudinary config
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safeName =
      Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.\-\_]/g, "_");
    cb(null, safeName);
  },
});

// Sử dụng Cloudinary nếu có config, không thì dùng local
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const storage = useCloudinary ? cloudinaryStorage : localStorage;
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

console.log(
  useCloudinary
    ? "✅ Cloudinary storage enabled - ảnh sẽ được lưu vĩnh viễn trên cloud"
    : "⚠️ Using local storage - ảnh có thể bị mất khi server restart"
);

// GET posts (expose full URLs for photos)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .select(
        "title price area location photos vip user district rentalModel description address createdAt timestamps"
      )
      .sort({ createdAt: -1 });
    const host = req.protocol + "://" + req.get("host");
    const transformed = posts.map((p) => {
      const obj = p.toObject();
      if (obj.photos && obj.photos.length) {
        obj.photos = obj.photos.map((fn) =>
          fn.startsWith("http") ? fn : host + "/uploads/" + fn
        );
      }
      return obj;
    });
    res.json(transformed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// simple POST (JSON) — keep for compatibility
router.post("/", authenticateToken, async (req, res) => {
  try {
    const post = new Post({ ...req.body, user: req.user.id });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ======================= ĐĂNG TIN MỚI (có upload ảnh) =======================
router.post(
  "/create",
  authenticateToken,
  upload.array("images", 12),
  async (req, res) => {
    try {
      // only admin can create posts
      if (!req.user || req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Chỉ admin mới được phép đăng tin" });
      }

      const {
        title,
        address,
        price,
        area,
        description,
        district,
        rentalModel,
      } = req.body;
      if (!title || !address || !price || !area) {
        return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
      }

      // Lấy URL ảnh từ Cloudinary hoặc filename từ local storage
      const files = req.files || [];
      let photoUrls = [];

      if (useCloudinary) {
        // Cloudinary trả về full URL trong file.path
        photoUrls = files.map((f) => f.path);
        console.log("📸 Cloudinary URLs:", photoUrls);
      } else {
        // Local storage - chỉ lưu filename
        photoUrls = files.map((f) => f.filename);
      }

      // If no uploaded files but client provided an image URL fallback, accept it
      if ((!photoUrls || photoUrls.length === 0) && req.body.image) {
        // allow direct URL in photos array
        photoUrls.push(req.body.image);
      }

      const newPost = new Post({
        title,
        location: address,
        district: district || "",
        rentalModel: rentalModel || "",
        price,
        area,
        description,
        photos: photoUrls,
        user: req.user.id,
        createdAt: new Date(),
      });

      await newPost.save();

      console.log("✅ Post saved with photos:", photoUrls);

      res.json({ message: "✅ Đăng tin thành công!", post: newPost });
    } catch (error) {
      console.error("❌ Error creating post:", error);
      res.status(500).json({ message: "Lỗi server: " + error.message });
    }
  }
);

module.exports = router;
