const express = require("express");
const { getOneThueGame, updateThueGame, createThueGame, getOneLienHe, createLienHe, updateLienHe } = require("../controllers/ThueGame_LienHe/text.controller");


const router = express.Router();

router.get("/get-thuegame", getOneThueGame );
router.post("/create-thuegame", createThueGame );
router.put("/update-thuegame", updateThueGame );

router.get("/get-lienhe", getOneLienHe );
router.post("/create-lienhe", createLienHe );
router.put("/update-lienhe", updateLienHe );


module.exports = router;