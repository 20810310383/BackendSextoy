const HangSX = require('../../model/HangSX');
const mongoose = require('mongoose');  // Đảm bảo bạn đã import mongoose
const { Types } = require('mongoose');  // Đảm bảo rằng bạn đã import Types từ mongoose
const LoaiSP = require('../../model/LoaiSP');
const { ObjectId } = mongoose.Types;

require('dotenv').config();

module.exports = {

    getHangSX: async (req, res) => {
        try {
            const { page, limit, TenHangSX } = req.query; 
    
            // Chuyển đổi thành số
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);
    
            // Tính toán số bản ghi bỏ qua
            const skip = (pageNumber - 1) * limitNumber;
    
            // Tạo query tìm kiếm
            const query = {};
            if (TenHangSX) {
                const searchKeywords = (TenHangSX || '')
                const keywordsArray = searchKeywords.trim().split(/\s+/);
    
                const searchConditions = keywordsArray.map(keyword => ({
                    TenHangSX: { $regex: keyword, $options: 'i' } // Tìm kiếm không phân biệt chữ hoa chữ thường
                }));
    
                query.$or = searchConditions;
            }
    
            let hangsx = await HangSX.find(query).populate("IdLoaiSP").skip(skip).limit(limitNumber)

            const totalHangSXP = await HangSX.countDocuments(query); // Đếm tổng số chức vụ

            const totalPages = Math.ceil(totalHangSXP / limitNumber); // Tính số trang
           
            if(hangsx) {
                return res.status(200).json({
                    message: "Đã tìm ra hãng sx",
                    errCode: 0,
                    data: hangsx,
                    totalHangSXP,
                    totalPages,
                    currentPage: pageNumber,
                })
            } else {
                return res.status(500).json({
                    message: "Tìm thể loại thất bại!",
                    errCode: -1,
                })
            }

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }        
    }, 

    createHangSX: async (req, res) => {
        try {
            let {TenHangSX, IdLoaiSP} = req.body              

            let checkTenHangSX = await HangSX.findOne({
                TenHangSX: { $regex: new RegExp(`^${TenHangSX}$`, 'i') }  // Sử dụng $regex với tùy chọn 'i' để không phân biệt hoa thường
            })
            if(checkTenHangSX){
                return res.status(500).json({
                    message: "Trùng tên Hãng, Bạn không thể thêm mới!",                    
                    errCode: 0,
                })
            }

            let createHangSX = await HangSX.insertMany({TenHangSX, IdLoaiSP})

            if(createHangSX){
                console.log("Inserted documents: ", createHangSX);
                return res.status(200).json({
                    message: "Bạn đã thêm hãng sản phẩm thành công!",
                    errCode: 0,
                    data: createHangSX
                })
            } else {
                return res.status(500).json({
                    message: "Bạn thêm hãng sản phẩm thất bại!",                
                    errCode: -1,
                })
            }    

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }        
    },
  
    updateHangSX: async (req, res) => {
        try {
            const { TenHangSX, IdLoaiSP } = req.body;
    
            // Chuyển đổi mảng IdLoaiSP từ chuỗi thành ObjectId
            // const objectIdArray = IdLoaiSP.map(id => mongoose.Types.ObjectId(id));
            let objectIdArray = []
            for (let i = 0; i < IdLoaiSP.length; i++) {
                // objectIdArray.push(IdLoaiSP[i]);  
                objectIdArray.push(new mongoose.Types.ObjectId(IdLoaiSP[i]));  
            }
            console.log("objectIdArray: ",objectIdArray);
                
            // Cập nhật các tài liệu có TenHangSX
            const updateResult = await HangSX.updateMany(
                { TenHangSX: TenHangSX }, // Điều kiện tìm kiếm tài liệu cần cập nhật
                { $set: { IdLoaiSP: objectIdArray } } // Cập nhật IdLoaiSP đã chuyển thành ObjectId
            );
    
            console.log("Số tài liệu bị cập nhật: ", updateResult.nModified);
    
            // Trả về kết quả thành công
            return res.status(200).json({
                message: "Cập nhật hãng sản phẩm thành công!",
                data: updateResult
            });
        } catch (error) {
            console.error("Lỗi khi cập nhật hãng sản phẩm:", error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message
            });
        }
    },
    
    deleteHangSX: async (req, res) => {
        try {
            const nameHSX = req.params.nameHSX
            let xoaHangSX = await HangSX.deleteMany({TenHangSX: nameHSX})

            if(xoaHangSX) {
                return res.status(200).json({
                    data: xoaHangSX,
                    message: "Bạn đã xoá hãng sản phẩm thành công!"
                })
            } else {
                return res.status(500).json({
                    message: "Bạn đã xoá hãng sản phẩm thất bại!"
                })
            }

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }
    },
}