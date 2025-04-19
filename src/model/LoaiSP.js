const mongoose = require('mongoose')
const mongoose_delete = require('mongoose-delete');

const LoaiSP_Schema = new mongoose.Schema(
    {
        TenLoaiSP: { type: String, required: false },
        Icon: String,
        Image: String,
        totalProducts: { type: Number, default: 0 },  // Thay đổi từ String sang Number
    },
    { 
        timestamps: true,   // createAt, updateAt
    },

);

// Override all methods
// LoaiSP_Schema.plugin(mongoose_delete, { overrideMethods: 'all' });

const LoaiSP = mongoose.model('LoaiSP', LoaiSP_Schema);

module.exports = LoaiSP;