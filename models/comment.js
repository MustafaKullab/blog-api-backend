const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  content: {
    type: String,
    required: [true, "Content of comment is required"],
  },
  postId: {
    type: Schema.Types.ObjectId,
    ref: "post",
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
});

const Comment = mongoose.model("comment", commentSchema);

module.exports = Comment;
