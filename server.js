require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

// Connected with database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected with database successfully");
    app.listen(process.env.PORT, () => {
      console.log(`Server is listening now on port ${process.env.PORT}`);
    });
  })
  .catch((error) => console.log(error));
