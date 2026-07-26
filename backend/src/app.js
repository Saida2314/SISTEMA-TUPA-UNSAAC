const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const publicRoutes = require("./routes/public.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensaje: "API del Sistema TUPA UNSAAC funcionando correctamente"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);

module.exports = app;