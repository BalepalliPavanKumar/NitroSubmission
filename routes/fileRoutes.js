const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadMiddleware");
const fileController = require("../controllers/fileController");

router.post("/", upload.single("file"), fileController.uploadFile);

router.get("/:file_id/progress", fileController.getProgress);

router.get("/:file_id", fileController.getFileContent);

router.get("/", fileController.listFiles);

router.delete("/:file_id", fileController.deleteFile);

module.exports = router;
