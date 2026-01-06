const mongoose = require("mongoose");
const postSchema = new mongoose.Schema(
  {
    title: String,
    price: Number,
    area: Number,
    location: String,
    district: String,
    rentalModel: String,
    photos: [String],
    description: String,
    address: String,
    vip: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    time: { type: String, default: () => new Date().toLocaleString("vi-VN") },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Post", postSchema);
