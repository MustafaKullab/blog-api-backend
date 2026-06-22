require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/errorHandler");
const router = require("./routes/router");

const app = express();

//Protect the server
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// allow the front end to access to the back end server
app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
  })
);

//Prevent too many request
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many request, please try again later",
  })
);

app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser());

app.use(router);
app.use(errorHandler);

module.exports = app;
