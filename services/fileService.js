const File = require("../models/File");
const { parseFile } = require("../utils/parser");


async function saveFileMetadata(file) {
  const newFile = new File({
    filename: file.originalname,
    path: file.path,
    mimetype: file.mimetype,
    size: file.size,
    status: "processing",
    progress: 0,
  });

  return await newFile.save();
}


async function processFile(fileId, filePath, mimetype) {
  try {
    let fileType = "csv";
    if (mimetype.includes("spreadsheetml")) fileType = "xlsx";
    else if (mimetype.includes("pdf")) fileType = "pdf";

    const parsedData = await parseFile(filePath, fileType);

    await File.findByIdAndUpdate(fileId, {
      parsedContent: parsedData,
      status: "ready",
      progress: 100,
    });
  } catch (err) {
    console.error("File processing failed:", err.message);
    await File.findByIdAndUpdate(fileId, {
      status: "failed",
      progress: 0,
    });
  }
}

module.exports = { saveFileMetadata, processFile };
