const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");
const { validationResult } = require("express-validator");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");

//Function to handle with errors that comes from mongoose
function handleErrors(err) {
  const errors = {};

  console.log(err);

  //Error messages from mongoose "signup"
  if (err.message.includes("validation failed")) {
    Object.values(err.errors).map((error) => {
      errors[error.path] = error.message;
    });
  }

  //Unique Error message
  if (err.code === 11000) {
    errors["email"] = "This email is already registered, please login";
  }

  //   Login errors
  if (err.message.includes("User is not found!")) {
    errors["email"] = "User is not found!";
  }

  if (err.message.includes("Password is not correct")) {
    errors["password"] = "Password is not correct";
  }

  return errors;
}

// Function to create access and refresh token
const createAccessToken = (id) => {
  return jwt.sign({ id }, process.env.ACCESS_TOKEN, { expiresIn: "15m" });
};

const createRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.REFRESH_TOKEN, { expiresIn: "7d" });
};

const post_signup = async (req, res) => {
  const { username, email, avatar, password, confPass } = req.body;

  //Errors from router
  const result = validationResult(req);
  const errors = {};
  if (!result.isEmpty()) {
    result.array().map((error) => {
      errors[error.path] = error.msg;
    });
    return res.status(400).json({ success: false, errors });
  }

  try {
    const avatar = req.file ? `uploads/${req.file.filename}` : null;

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    await sendEmail({
      to: email,
      subject: "كود تأكيد الحساب",
      text: `مرحبا ${username}, كود تأكيد حسابك هو : ${verificationCode}`,
    });

    const user = await User.create({
      username,
      email,
      avatar,
      password,
      confPass,
      verificationCode,
    });
    res.status(201).json({ success: true, user });
  } catch (error) {
    const errors = handleErrors(error);
    res.status(400).json({ success: false, errors });
  }
};

const post_verify = async (req, res, next) => {
  const { userId, code } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User is not found" });
    }

    if (user.verificationCode !== code) {
      return res
        .status(400)
        .json({ success: false, message: "Code is not correct" });
    }

    await User.findByIdAndUpdate(userId, {
      verificationCode: null,
      isVerified: true,
    });

    //Create access and refresh token and send cookies
    const accessToken = createAccessToken(user._id);

    const refreshToken = createRefreshToken(user._id);

    //Send Cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const post_login = async (req, res) => {
  const { email, password } = req.body;

  //Errors from router
  const result = validationResult(req);
  const errors = {};
  if (!result.isEmpty()) {
    result.array().map((error) => {
      errors[error.path] = error.msg;
    });
    return res.status(400).json({ success: false, errors });
  }

  try {
    const user = await User.login(email, password);

    if (!user) {
      return res.status(400).json({ success: false, user });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message:
          "Your account is registered but not verified yet. Please check your email to activate it.",
      });
    }

    //Create access and refresh token and send cookies
    const accessToken = createAccessToken(user._id);

    const refreshToken = createRefreshToken(user._id);

    //Send Cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    const errors = handleErrors(error);
    res.status(400).json({ success: false, errors });
  }
};

const post_forgot = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User is not found" });
    }

    const resetPasswordCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    await User.findByIdAndUpdate(user._id, {
      verificationCode: resetPasswordCode,
    });

    await sendEmail({
      to: email,
      subject: "كود تغيير كلمة المرور",
      text: `الكود هو : ${resetPasswordCode}`,
    });

    res.status(200).json({ success: true, userId: user._id });
  } catch (error) {
    next(error);
  }
};

const post_resetPass = async (req, res, next) => {
  const { userId, code, newPassword, retypePassword } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User is not found!" });
    }

    if (user.verificationCode !== code) {
      return res
        .status(400)
        .json({ success: false, message: "Code is not correct" });
    }

    if (newPassword !== retypePassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords is not equal" });
    }

    user.verificationCode = null;
    user.password = newPassword;
    user.confPass = retypePassword;
    await user.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const post_post = async (req, res) => {
  const { title, content } = req.body;
  const userId = req.user._id;

  const image = req.file ? `uploads/${req.file.filename}` : null;

  //Errors from router
  const result = validationResult(req);
  const errors = {};
  if (!result.isEmpty()) {
    result.array().map((error) => {
      errors[error.path] = error.msg;
    });
    return res.status(400).json({ success: false, errors });
  }

  try {
    const post = await Post.create({ title, content, image, userId });
    res.status(201).json({ success: true, post });
  } catch (error) {
    const errors = handleErrors(error);
    res.status(400).json({ success: false, errors });
  }
};

const post_myPosts = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const posts = await Post.find({ userId }).populate("userId").lean();

    for (post of posts) {
      post.comment = await Comment.find({ postId: post._id })
        .populate("userId")
        .lean();
    }

    res.status(200).json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

const delete_post = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const post = await Post.findById(id);

    if (String(post.userId) !== String(userId)) {
      return res.status(400).json({
        success: false,
        message:
          "Posts can only be deleted by their creators or platform moderators.",
      });
    }
    const postDeleted = await Post.findByIdAndDelete(id);
    res.status(200).json({ success: true, postDeleted });
  } catch (error) {
    next(error);
  }
};

const put_updatePost = async (req, res, next) => {
  const { newTitle, newContent } = req.body;
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const post = await Post.findById(id);

    console.log(post);

    if (String(post.userId) !== String(userId)) {
      return res.status(400).json({
        success: false,
        message: "Posts can only be updated or edited by their creators.",
      });
    }

    const updatedPost = await Post.findByIdAndUpdate(id, {
      title: newTitle,
      content: newContent,
    });

    res.status(200).json({ success: true, updatedPost });
  } catch (error) {
    next(error);
  }
};

const post_comment = async (req, res) => {
  const { content, postId } = req.body;
  const userId = req.user._id;

  try {
    const comment = await Comment.create({ content, postId, userId });

    res.status(201).json({ success: true, comment });
  } catch (error) {
    const errors = handleErrors(error);
    res.status(400).json({ success: false, errors });
  }
};

const delete_comment = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;
  try {
    const comment = await Comment.findById(id);
    if (String(userId) !== String(comment.userId._id)) {
      return res.status(400).json({
        success: false,
        message: "A comment can be deleted by its author or the post owner.",
      });
    }

    const commentDeleted = await Comment.findByIdAndDelete(id);

    res.status(200).json({ success: true, commentDeleted });
  } catch (error) {
    next(error);
  }
};

const post_allPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().populate("userId").lean();

    for (post of posts) {
      post.comment = await Comment.find({ postId: post._id })
        .populate("userId")
        .lean();
    }

    res.status(200).json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

const post_currentUser = async (req, res, next) => {
  const userId = req.user._id;
  try {
    const user = await User.findById(userId);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const post_refresh = (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    jwt.verify(token, process.env.REFRESH_TOKEN, (err, decoded) => {
      if (err) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid token. Access denied." });
      } else {
        const accessToken = createAccessToken(decoded.id);
        res.cookie("accessToken", accessToken, {
          httpOnly: true,
          maxAge: 15 * 60 * 1000,
        });
        res.status(200).json({ success: true });
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Session expired. Please log in again",
    });
  }
};

const post_logout = (req, res) => {
  res.cookie("accessToken", "", { maxAge: 1 });
  res.cookie("refreshToken", "", { maxAge: 1 });
  res.status(200).json({ success: true });
};

module.exports = {
  post_signup,
  post_verify,
  post_login,
  post_forgot,
  post_resetPass,
  post_post,
  post_myPosts,
  put_updatePost,
  delete_post,
  post_comment,
  delete_comment,
  post_allPosts,
  post_currentUser,
  post_refresh,
  post_logout,
};
