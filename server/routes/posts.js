const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const path = require("path");
const fs = require("fs");

// ✅ IMPORT MIDDLEWARE XÁC THỰC
const authenticateToken = require("../middleware/auth");

// Setup uploads folder
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safeName =
      Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.\-\_]/g, "_");
    cb(null, safeName);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

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

      // Save filenames (store only filenames in DB)
      const files = req.files || [];
      const filenames = files.map((f) => f.filename);

      // If no uploaded files but client provided an image URL fallback, accept it
      if ((!filenames || filenames.length === 0) && req.body.image) {
        // allow direct URL in photos array
        filenames.push(req.body.image);
      }

      const newPost = new Post({
        title,
        location: address,
        district: district || "",
        rentalModel: rentalModel || "",
        price,
        area,
        description,
        photos: filenames,
        user: req.user.id,
        createdAt: new Date(),
      });

      await newPost.save();

      res.json({ message: "✅ Đăng tin thành công!", post: newPost });
    } catch (error) {
      res.status(500).json({ message: "Lỗi server: " + error.message });
    }
  }
);

module.exports = router;
