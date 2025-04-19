const express = require("express");
// import { createVoucher, deleteVoucher, getVoucher, updateVoucher } from '../controllers/Voucher_KhachHang/voucher.controller';
const { createVoucher, deleteVoucher, getVoucher, updateVoucher } = require('../controllers/Voucher_KhachHang/voucher.controller');

const router = express.Router();

// find all voucher
router.get("/get-voucher", getVoucher );

// tao moi voucher
router.post("/create-voucher", createVoucher );

// update voucher
router.put("/update-voucher", updateVoucher );

// delete voucher
router.delete("/delete-voucher/:id", deleteVoucher );

module.exports = router;