const mongoose = require('mongoose');

const Voucher_Schema = new mongoose.Schema({   
        code: { type: String},
        dieuKien: { type: String},             
        giamGia: { type: String},        
        thoiGianHetHan: { type: String},  
    },
    { 
        timestamps: true,   // createAt, updateAt
    }
);


module.exports = mongoose.model("Voucher", Voucher_Schema);