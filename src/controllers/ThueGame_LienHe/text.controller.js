const LienHe = require("../../model/LienHe");
const ThueGame = require("../../model/ThueGame");


module.exports = {

    getOneThueGame: async (req, res) => {
        try {
            const thueGame = await ThueGame.findOne({});
            res.status(200).json({data: thueGame});
        } catch (error) {
            res.json({ message: error });
        }
    },

    getOneLienHe: async (req, res) => {
        try {
            const thueGame = await LienHe.findOne({});
            res.status(200).json({data: thueGame});
        } catch (error) {
            res.json({ message: error });
        }
    },

    updateThueGame: async (req, res) => {
        try {
            const { _id, text } = req.body;
            const updateThueGame = await ThueGame.updateOne({ _id: _id }, { text: text });
            if (updateThueGame) {
                res.status(200).json({ message: "Update ThueGame thành công", data: updateThueGame });
            } else {
                res.status(404).json({ message: "Update ThueGame thất bại" });
            }
        } catch (error) {
            res.json({ message: error });
        }
    },
    updateLienHe: async (req, res) => {
        try {
            const { _id, text } = req.body;
            const updateLienHe = await LienHe.updateOne({ _id: _id }, { text: text });
            if (updateLienHe) {
                res.status(200).json({ message: "Update LienHe thành công", data: updateLienHe });
            } else {
                res.status(404).json({ message: "Update LienHe thất bại" });
            }
        } catch (error) {
            res.json({ message: error });
        }
    },

    createThueGame: async (req, res) => {
        try {
            const { text } = req.body;
            const newThueGame = new ThueGame({ text });
            await newThueGame.save();
            res.status(200).json({ message: "Thêm ThueGame thành công", data: newThueGame });
        } catch (error) {
            res.json({ message: error });
        }
    },

    createLienHe: async (req, res) => {
        try {
            const { text } = req.body;
            const newLienHe = new LienHe({ text });
            await newLienHe.save();
            res.status(200).json({ message: "Thêm LienHe thành công", data: newLienHe });
        } catch (error) {
            res.json({ message: error });
        }
    },
}