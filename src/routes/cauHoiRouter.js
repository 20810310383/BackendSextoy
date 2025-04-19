const express = require("express");
const { getCauHoi, createCauHoi, updateCauHoi, deleteCauHoi } = require("../controllers/CauHoi/cauhoi.controller");


const router = express.Router();

// find all the loai
router.get("/get-cau-hoi", getCauHoi );

// tao moi the loai
router.post("/create-cau-hoi", createCauHoi );

// update the loai
router.put("/update-cau-hoi", updateCauHoi );

// delete the loai
router.delete("/delete-cau-hoi/:id", deleteCauHoi );

module.exports = router;