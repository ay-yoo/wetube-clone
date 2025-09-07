import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  email: { type: String, requred: true, unique: true },
  avatarUrl: String,
  socialOnly: { type: Boolean, default: false },
  username: { type: String, requred: true, unique: true },
  password: { type: String, requred: false },
  name: { type: String, requred: true },
  location: String,
  videos: [
    { type: mongoose.Schema.Types.ObjectId, requires: true, ref: "Video" },
  ],
  comments: [
    { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Comment" },
  ],
});

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 5);
  }
});
const User = mongoose.model("User", userSchema);
export default User;
