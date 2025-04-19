const express = require("express");
// import { createHangSX, deleteHangSX, getHangSX, updateHangSX } from '../controllers/HangSX/hangSX.controller';
const { createHangSX, deleteHangSX, getHangSX, updateHangSX } = require('../controllers/HangSX/hangSX.controller');

const router = express.Router();

// find all hang sx
// router.get("/get-hang-sx", hangSX.getHangSX );
router.get("/get-hang-sx", getHangSX );

// tao moi hang sx
router.post("/create-hang-sx", createHangSX );

// update hang sx
router.put("/update-hang-sx", updateHangSX );

// delete hang sx
router.delete("/delete-hang-sx/:nameHSX", deleteHangSX );

module.exports = router;