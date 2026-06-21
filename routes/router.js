const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const upload = require("../middleware/upload");
const authUser = require("../middleware/authUser");

// methods from controller
const {
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
} = require("../controllers/controller");

//Router to sign new user
router.post(
  "/signup",
  upload.single("avatar"),
  [
    body("username")
      .notEmpty()
      .withMessage("Username is required")
      .trim()
      .escape(),
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please enter a valid email")
      .trim()
      .escape(),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength()
      .withMessage("Password must be contains at least 6 chars")
      .trim(),
    body("confPass")
      .notEmpty()
      .withMessage("Please confirm your password")
      .trim(),
  ],
  post_signup
);

// Router to verify user
router.post("/verify", post_verify);

//Router to login user
router.post(
  "/login",
  [
    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please enter a valid email")
      .trim()
      .escape(),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength()
      .withMessage("Password must be contains at least 6 chars")
      .trim(),
  ],
  post_login
);

// Router to handle with forgot password
router.post("/forgotPassword", post_forgot);

// Router to reset password
router.post("/resetPassword", post_resetPass);

// Router to add new post
router.post("/post", upload.single("image"), authUser, post_post);

// Router to diaplay th posts of user
router.post("/myposts", authUser, post_myPosts);

// Router to update the post
router.put("/post/:id", authUser, put_updatePost);

// Router to delete the post
router.delete("/post/:id", authUser, delete_post);

// Router to add new comment
router.post("/postComment", authUser, post_comment);

// Router to delete the comment
router.delete("/deleteComment/:id", authUser, delete_comment);

// Router to display all posts
router.post("/allposts", post_allPosts);

// Router to get current user
router.post("/currentUser", authUser, post_currentUser);

// Router to refresh the tokens
router.post("/refresh", post_refresh);

// Router to log out user
router.post("/logout", post_logout);

module.exports = router;
