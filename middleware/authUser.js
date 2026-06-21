const jwt = require("jsonwebtoken");
const User = require("../models/user");

const authUser = async (req, res, next) => {
  const token = req.cookies.accessToken;
  if (token) {
    jwt.verify(token, process.env.ACCESS_TOKEN, async (err, decodeURI) => {
      if (err) {
        return res
          .status(401)
          .json({ success: false, message: "Something went error" });
      } else {
        req.user = await User.findById(decodeURI.id);
        next();
      }
    });
  } else {
    res
      .status(401)
      .json({ success: false, message: "The access token has expired." });
  }
};

module.exports = authUser;
