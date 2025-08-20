const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { File } = require("./models/fileModel");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const csv = require("csv-parser");
require("dotenv").config();
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
};

connectDB();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});
const upload = multer({ storage });

app.post("/files", upload.single("file"), async (req, res) => {
  try {
    const file = new File({
      filename: req.file.originalname,
      path: req.file.path,
      status: "uploading",
      progress: 0,
    });

    await file.save();

    parseFileAsync(file._id, file.path);

    res.json({ file_id: file._id, message: "File uploaded, parsing started" });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

app.get("/files/:fileId/progress", async (req, res) => {
  const file = await File.findById(req.params.fileId);
  if (!file) return res.status(404).json({ message: "File not found" });

  res.json({
    file_id: file._id,
    status: file.status,
    progress: file.progress,
  });
});

app.get("/files/:fileId", async (req, res) => {
  const file = await File.findById(req.params.fileId);
  if (!file) return res.status(404).json({ message: "File not found" });

  if (file.status !== "ready") {
    return res.json({
      message: "File upload or processing in progress. Please try again later."
    });
  }

  res.json({ content: file.parsedContent });
});

app.get("/files", async (req, res) => {
  const files = await File.find();
  res.json(files);
});

app.delete("/files/:fileId", async (req, res) => {
  const file = await File.findById(req.params.fileId);
  if (!file) return res.status(404).json({ message: "File not found" });

  try {
    fs.unlinkSync(file.path); 
  } catch (err) {
    console.warn("⚠️ File not found on disk, skipping delete");
  }

  await File.findByIdAndDelete(req.params.fileId);
  res.json({ message: "File deleted successfully" });
});

async function parseFileAsync(fileId, filePath) {
  let progress = 0;

  await File.findByIdAndUpdate(fileId, { status: "processing", progress });

  const results = [];

  const interval = setInterval(async () => {
    progress += 20;
    if (progress <= 100) {
      await File.findByIdAndUpdate(fileId, { progress });
    }
  }, 500);

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => results.push(row))
    .on("end", async () => {
      clearInterval(interval);
      await File.findByIdAndUpdate(fileId, {
        status: "ready",
        progress: 100,
        parsedContent: results,
      });
      console.log("CSV Parsing complete for file:", fileId);
    })
    .on("error", async (err) => {
      clearInterval(interval);
      await File.findByIdAndUpdate(fileId, { status: "failed" });
      console.error(" Parsing failed:", err);
    });
}

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
