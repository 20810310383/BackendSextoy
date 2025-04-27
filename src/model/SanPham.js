const mongoose = require('mongoose')
const mongoose_delete = require('mongoose-delete');
const HangSX = require('./HangSX');
const LoaiSP = require('./LoaiSP');

const sizesSchema = new mongoose.Schema({
    size: { type: String, required: false },
    quantity: { type: Number, required: false },
    price: { type: Number, required: false } // Thêm đơn giá
});

const SanPham_Schema = new mongoose.Schema(
    {
        TenSP: { type: String, required: false },
        GiaBan: { type: Number, required: false },
        GiamGiaSP: { type: Number, default: "0" },
        SoNgayKM: { type: String },
        urlYoutube: { type: String },
        GiamGiaTheoNgay: { type: Number, default: "0" },
        MoTa: { type: String, default: "Not thing" },
        MoTaMotChut: { type: String, default: "Not thing" },
        MoTaChiTiet: { type: String, default: "Not thing" },
        SoLuongBan: { type: Number, required: false, default: "1" },
        SoLuotDanhGia: { type: Number, required: false, default: "1000" },
        ImageSlider: [{ type: String }],    
        Image: { type: String, required: false },     
        IdHangSX: {ref: "HangSX", type: mongoose.SchemaTypes.ObjectId},
        IdLoaiSP: [{ref: "LoaiSP", type: mongoose.SchemaTypes.ObjectId}],
        // sizes: [sizesSchema],
        sizes:{ type: Number, required: false },
        SoLuongTon: { type: Number, required: false, default: 0 },
        KhuyenMaiBatDau: { type: Date, required: false, default: Date.now },
        KhuyenMaiKetThuc: { type: Date, required: false, default: Date.now },
        isHot: { type: Boolean, default: false },
    },
    { 
        timestamps: true,   // createAt, updateAt
    },
);

// Middleware ... tính SoLuongTon = tổng các quantity trong sizesSchema
// SanPham_Schema.pre('save', function(next) {
//     const sumQuantity = this.sizes.reduce((total, sq) => total + sq.quantity, 0);
//     this.SoLuongTon = sumQuantity;
//     next();
// });

// Thêm pre-save hook để tự động cập nhật GiaBan
// SanPham_Schema.pre('save', function(next) {
//     if (this.sizes && this.sizes.length > 0) {
//         this.GiaBan = this.sizes[0].price;
//     } else {
//         this.GiaBan = 0; // hoặc giá trị mặc định nào đó nếu không có giá trong sizes
//     }
//     next();
// });


// tự động cập nhật lại GiaBan khi price[0] được sửa đổi
// SanPham_Schema.post('findOneAndUpdate', async function(doc, next) {
//     if (!doc) return next(); // Nếu không có sản phẩm được cập nhật, tiếp tục

//     const modifiedFields = this.getUpdate(); // Lấy các trường đã được cập nhật

//     if (modifiedFields['$set'] && modifiedFields['$set']['sizes']) {
//         // Nếu có sự thay đổi trong sizes, cập nhật GiaBan
//         const updatedProduct = await SanPham.findById(doc._id);
//         if (updatedProduct.sizes && updatedProduct.sizes.length > 0) {
//             updatedProduct.GiaBan = updatedProduct.sizes[0].price;
//             await updatedProduct.save(); // Lưu lại sản phẩm với GiaBan mới
//         }
//     }

//     next(); // Chuyển điều khiển sang middleware tiếp theo (nếu có)
// });

// Middleware trong schema SanPham khi tạo sản phẩm mới
// SanPham_Schema.post('save', async function (doc) {
//     // Lấy loại sản phẩm (IdLoaiSP) từ sản phẩm mới
//     const loaiSPIds = doc.IdLoaiSP;

//     // Cập nhật trường totalProducts cho mỗi loại sản phẩm
//     for (const loaiSPId of loaiSPIds) {
//         await LoaiSP.findByIdAndUpdate(loaiSPId, {
//             $inc: { totalProducts: 1 },  // Tăng tổng số sản phẩm lên 1
//         });
//     }
// });








// Override all methods
SanPham_Schema.plugin(mongoose_delete, { overrideMethods: 'all' });

const SanPham = mongoose.model('SanPham', SanPham_Schema);

module.exports = SanPham;