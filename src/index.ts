import express from "express";

const app = express();
const port = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("Hello Gatsby!");
});

app.listen(port, () => {
  // tslint:disable-next-line
  console.log(`Server started at http://localhost:${port}`);
});
