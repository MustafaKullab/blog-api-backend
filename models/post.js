const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
  },
  content: {
    type: String,
    required: [true, "Content is required"],
  },
  image: {
    type: String,
    default: null,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
});

const Post = mongoose.model("post", postSchema);

module.exports = Post;
