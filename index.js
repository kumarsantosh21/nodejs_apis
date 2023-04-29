// require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const authRoutes = require("./routes/authRoutes");
const sourceRoutes = require("./routes/sourceRoutes");
const chartsRoutes = require("./routes/chartsRoutes");
const path = require("path");
const { verifyToken } = require("./controllers/authController");
const { postgraphileDB } = require("./controllers/postgraphileController");

const port = process.env.PORT;
console.log({ port });

app.use(express.json());
app.use(cors());
app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/auth", authRoutes);
app.use("/source", sourceRoutes);
app.use("/chart", chartsRoutes);
app.use("/pgapi/graphql", verifyToken, postgraphileDB);

app.listen(port, () => {
  console.log(`Server is running on port ${port} successfully`);
});
