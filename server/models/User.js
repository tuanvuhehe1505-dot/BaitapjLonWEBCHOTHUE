const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  // role: 'user' or 'admin'
  role: { type: String, enum: ["user", "admin"], default: "user" },

  // ✅ THÊM OTP FIELDS
  resetOTP: String,
  resetOTPExpiry: Date,

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
