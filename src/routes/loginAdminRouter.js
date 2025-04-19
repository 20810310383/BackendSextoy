const express = require("express");
// import  { loginAccAdmin, logoutAdmin, registerAccAdmin } from '../controllers/Login/login.admin.controller';
// import { deleteAccAdmin, getAccAdmin, getRole, khoaAccAdmin, updateAccAdmin } from '../controllers/NhanVien/nhanVien.controller';
const { loginAccAdmin, logoutAdmin, registerAccAdmin } = require('../controllers/Login/login.admin.controller');
const { deleteAccAdmin, getAccAdmin, getRole, khoaAccAdmin, updateAccAdmin } = require('../controllers/NhanVien/nhanVien.controller');

const router = express.Router();

// route đăng nhập admin
router.post("/login-admin", loginAccAdmin );
// route register admin
router.post("/register-admin", registerAccAdmin );
// route logout  admin
router.post("/logout-admin", logoutAdmin );

router.get("/get-admin", getAccAdmin );

router.put("/update-admin", updateAccAdmin );

router.put("/khoa-admin", khoaAccAdmin );

router.delete("/delete-admin/:id", deleteAccAdmin );

router.get("/get-role", getRole );

//--------------
// router.post("/login-admin", loginAdmin.loginAccAdmin );
// // route register admin
// router.post("/register-admin", loginAdmin.registerAccAdmin );
// // route logout  admin
// router.post("/logout-admin", loginAdmin.logoutAdmin );

// router.get("/get-admin", nhanVien.getAccAdmin );

// router.put("/update-admin", nhanVien.updateAccAdmin );

// router.put("/khoa-admin", nhanVien.khoaAccAdmin );

// router.delete("/delete-admin/:id", nhanVien.deleteAccAdmin );

// router.get("/get-role", nhanVien.getRole );


module.exports = router;