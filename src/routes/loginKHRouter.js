const express = require("express");
// import { verifyGoogleToken } from '../controllers/Login/login.google.controller';
// import { checkTrangThaiIsActive, loginAccKH, logoutKH, registerAccKH, xacThucOTP } from '../controllers/Login/login.kh.controller';
// import {doiThongTinKH} from '../controllers/Login/doi.thong.tin.kh.controller';
// import { quenMatKhauKH } from '../controllers/Login/quen.mat.khau.controller';
// import  { deleteAccKH, getAccKH, getOneAccKH, khoaAccKH, updateAccKH } from '../controllers/Voucher_KhachHang/khachHang.controller';
const { verifyGoogleToken } = require('../controllers/Login/login.google.controller');
const { checkTrangThaiIsActive, loginAccKH, logoutKH, registerAccKH, xacThucOTP } = require('../controllers/Login/login.kh.controller');
const { doiThongTinKH } = require('../controllers/Login/doi.thong.tin.kh.controller');
const { quenMatKhauKH } = require('../controllers/Login/quen.mat.khau.controller');
const { deleteAccKH, getAccKH, getOneAccKH, khoaAccKH, updateAccKH } = require('../controllers/Voucher_KhachHang/khachHang.controller');

const router = express.Router();

// route đăng nhập kh
router.post("/login-kh", loginAccKH );
// route register KH
router.post("/register-kh", registerAccKH );
// route logout  KH
router.post("/logout-kh", logoutKH );

router.post("/xac-thuc-otp-kh", xacThucOTP );

router.get("/check-status", checkTrangThaiIsActive );

// find all acc kh
router.get("/get-kh", getAccKH );

router.get("/get-one-kh", getOneAccKH );

// update acc kh
router.put("/update-kh", updateAccKH );

router.put("/khoa-kh", khoaAccKH );

// delete acc kh
router.delete("/delete-kh/:id", deleteAccKH );

// router.post("/auth/google", verifyGoogleToken );

// quên mật khẩu
router.post("/quen-mat-khau", quenMatKhauKH)

// đổi thông tin khách hàng
router.put("/doi-thong-tin", doiThongTinKH)

module.exports = router;