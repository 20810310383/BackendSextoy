const mongoose = require('mongoose');

const CauHoi_Schema = new mongoose.Schema({   
        fullName: { type: String },       
        email: { type: String },       
        cauHoi: { type: String },               
        cauTraLoi: { type: String, default: '' },               
    },
    { 
        timestamps: true,   // createAt, updateAt
    }
);

module.exports = mongoose.model("CauHoi", CauHoi_Schema);