// routes/uploadRoutes.js
const express = require("express");
const path = require("path");
const xlsx = require("xlsx");
const {
    uploadFile,
    uploadFiles,
    uploadExcelFile,
    deleteFile,
    uploadFileMutiple,
} = require("../controllers/Upload/upload.controller");
const { uploadFile1, uploadFiles1, deleteFile1 } = require("../controllers/Upload/uploadCloud.controller");
// import uploadFile, { uploadExcel, uploadExcelFile } from '../controllers/Upload/upload.controller';
const router = express.Router();

// // Tạo route upload
// router.post('/upload', uploadFile.uploadFile);
// router.post('/multiple', uploadFile.uploadFiles);
// router.post('/upload-excel', uploadExcelFile);

// router.post("/upload", uploadFile);
// router.post("/upload-mutiple", uploadFileMutiple);
// router.post("/delete", deleteFile);
// router.post("/multiple", uploadFiles);
// router.post("/upload-excel", uploadExcelFile);

router.post("/upload", uploadFile1);
router.post("/uploadSlider", uploadFiles1);
router.post("/delete", deleteFile1);



module.exports = router;
