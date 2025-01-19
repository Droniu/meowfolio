import express from "express";
import dotenv from "dotenv";
// import { getSignedUrl, saveToDynamo } from "./utils/aws";

dotenv.config();
console.log("Environment variables loaded!");

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Backend is running!");
});

// app.get("/signed-url", async (_req, res) => {
//   const signedUrl = await getSignedUrl("example-photo.jpg");
//   res.json({ signedUrl });
// });

// app.post("/save", async (req, res) => {
//   const result = await saveToDynamo(process.env.TABLE_NAME!, req.body);
//   res.json({ result });
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
