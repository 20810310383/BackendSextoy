const mongoose = require('mongoose');

const HopQua_Schema = new mongoose.Schema({   
        tenHopQua: { type: String},
        messageHopQua: { type: String, default: "Chúc mừng bạn đã nhận được một hộp quà từ chúng tôi" },             
        IdVoucher: {ref: "Voucher", type: mongoose.SchemaTypes.ObjectId, default: null},        
        IdKH: [{ref: "AccKH", type: mongoose.SchemaTypes.ObjectId, default: null}],        
    },
    { 
        timestamps: true,   // createAt, updateAt
    }
);
module.exports = mongoose.model("HopQua", HopQua_Schema);