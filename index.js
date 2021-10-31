const path = require("path");
const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
const port = 4000;
app.use(express.static("public"));
// app.use(express.static(path.join(__dirname, "./public")));
const shapes = [
  { name: "Cone", url: "/shapes/cone.x3d", img_url: "/images/cone.jpg" },
  { name: "Cube", url: "/shapes/cube.x3d", img_url: "/images/cube.jpg" },
  {
    name: "Cylender",
    url: "/shapes/cylender.x3d",
    img_url: "/images/cylender.jpg",
  },
  { name: "Deer", url: "/shapes/deer.x3d", img_url: "/images/deer.jpg" },
  { name: "Sphere", url: "/shapes/sphere.x3d", img_url: "/images/sphere.jpg" },
  { name: "Avatar", url: "/shapes/avatar.x3d", img_url: "/images/sphere.jpg" },
];
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/example", (req, res) => {
  res.send("Hello World!");
});
app.get("/shapes", (req, res) => {
  const { search } = req.query;
  return res.status(200).send({ shapes });
});
app.listen(port, () =>
  console.log(`server is listening at http://localhost:${port}`)
);
