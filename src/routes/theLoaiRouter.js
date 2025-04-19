const express = require("express");
// import { createTheLoai, deleteTheLoai, findOneCategory, getTheLoai, updateTheLoai } from '../controllers/TheLoai/theLoai.controller';
const { createTheLoai, deleteTheLoai, findOneCategory, getTheLoai, updateTheLoai, getHangAndLoai } = require('../controllers/TheLoai/theLoai.controller');

const router = express.Router();

// find all the loai
router.get("/get-the-loai", getTheLoai );
router.get("/get-hangsx-theo-loaisp", getHangAndLoai );
router.get("/get-one-the-loai", findOneCategory );

// tao moi the loai
router.post("/create-the-loai", createTheLoai );

// update the loai
router.put("/update-the-loai", updateTheLoai );

// delete the loai
router.delete("/delete-the-loai/:id", deleteTheLoai );

module.exports = router;