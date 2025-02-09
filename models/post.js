const mongoose = require("mongoose");
const user = require("./user");

const postSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  content: String,
  media: {
    type: String, // Stores the file path of uploaded image/video
    default: null, // If no media, it remains null
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("post", postSchema);
