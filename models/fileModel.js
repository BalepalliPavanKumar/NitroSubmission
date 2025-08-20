const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  path: { type: String, required: true },
  status: { type: String, enum: ["uploading", "processing", "ready", "failed"], default: "uploading" },
  progress: { type: Number, default: 0 },
  parsedContent: { type: Array, default: [] },
}, { timestamps: true });

const File = mongoose.model("File", fileSchema);

module.exports = { File };
