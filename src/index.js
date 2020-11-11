const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./db/mongoose");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", require("./routes"));

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log("Server is up on port " + port);
});
