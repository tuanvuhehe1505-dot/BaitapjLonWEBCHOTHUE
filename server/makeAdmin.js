require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("mongoose");
const User = require("./models/User");

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chothuenha";
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const phone = "0344886556";
    const user = await User.findOne({ phone });
    if (!user) {
      console.error("User not found for phone", phone);
      process.exitCode = 3;
      return;
    }
    user.role = "admin";
    await user.save();
    console.log("Updated user to admin:", user._id.toString());
    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    process.exitCode = 2;
  }
}

run();
