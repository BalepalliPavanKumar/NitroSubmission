const File = require("../models/fileModel");
const parseFile = require("../utils/parseFile");

exports.uploadFile = async (req, res) => {
  try {
    const file = new File({
      filename: req.file.originalname,
      filepath: req.file.path,
      status: "uploading",
      progress: 0,
    });

    await file.save();

    parseFile(req.file.path, file._id, File);

    res.json({ file_id: file._id, message: "File uploaded successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const file = await File.findById(req.params.file_id);
    if (!file) return res.status(404).json({ message: "File not found" });
    res.json({ file_id: file._id, status: file.status, progress: file.progress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFileContent = async (req, res) => {
  try {
    const file = await File.findById(req.params.file_id);
    if (!file) return res.status(404).json({ message: "File not found" });

    if (file.status !== "ready") {
      return res.json({ message: "File upload or processing in progress. Please try again later." });
    }

    res.json({ file_id: file._id, content: file.parsedContent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listFiles = async (req, res) => {
  try {
    const files = await File.find().sort({ createdAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const file = await File.findByIdAndDelete(req.params.file_id);
    if (!file) return res.status(404).json({ message: "File not found" });
    res.json({ message: "File deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
