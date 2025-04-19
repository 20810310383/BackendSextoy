const LoaiSP = require('../../model/LoaiSP');
const SanPham = require('../../model/SanPham');
const Voucher = require('../../model/Voucher');

require('dotenv').config();

module.exports = {

    getVoucher: async (req, res) => {
        try {
            let { page, limit, code} = req.query; 

            // Chuyển đổi thành số
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);           

            // Tính toán số bản ghi bỏ qua
            const skip = (pageNumber - 1) * limitNumber;

            // Tạo query tìm kiếm
            const query = {};
            if (code) {
                const searchKeywords = (code || '')
                const keywordsArray = searchKeywords.trim().split(/\s+/);

                const searchConditions = keywordsArray.map(keyword => ({
                    code: { $regex: keyword, $options: 'i' } // Tìm kiếm không phân biệt chữ hoa chữ thường
                }));

                query.$or = searchConditions;
            }           
                       
            let voucher = await Voucher.find(query).skip(skip).limit(limitNumber)           

            const totalVoucher = await Voucher.countDocuments(query); // Đếm tổng số chức vụ

            const totalPages = Math.ceil(totalVoucher / limitNumber); // Tính số trang

            if(voucher) {
                return res.status(200).json({
                    message: "Đã tìm ra voucher",
                    errCode: 0,
                    data: voucher,   
                    totalVoucher,
                    totalPages,
                    currentPage: pageNumber,
                })
            } else {
                return res.status(500).json({
                    message: "Tìm voucher thất bại!",
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

    createVoucher: async (req, res) => {
        try {
            let {code, dieuKien, giamGia, thoiGianHetHan} = req.body                       

            let createTL = await Voucher.create({code, dieuKien, giamGia, thoiGianHetHan})

            if(createTL){
                return res.status(200).json({
                    message: "Bạn đã thêm voucher thành công!",
                    errCode: 0,
                    data: createTL
                })
            } else {
                return res.status(500).json({
                    message: "Bạn thêm voucher thất bại!",                
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

    updateVoucher: async (req, res) => {
        try {
            let {_id, code, dieuKien, giamGia, thoiGianHetHan} = req.body

            let updateTL = await Voucher.updateOne({_id: _id},{code, dieuKien, giamGia, thoiGianHetHan})

            if(updateTL) {
                return res.status(200).json({
                    data: updateTL,
                    message: "Chỉnh sửa voucher thành công"
                })
            } else {
                return res.status(404).json({                
                    message: "Chỉnh sửa voucher thất bại"
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

    deleteVoucher: async (req, res) => {
        try {
            const _id = req.params.id
            let xoaTL = await Voucher.deleteOne({_id: _id})

            if(xoaTL) {
                return res.status(200).json({
                    data: xoaTL,
                    message: "Bạn đã xoá voucher thành công!"
                })
            } else {
                return res.status(500).json({
                    message: "Bạn đã xoá voucher thất bại!"
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

    findOneCategory: async (req, res) => {
        try {
            const _id = req.query.IdLoaiSP
            let category = await LoaiSP.findOne({_id: _id})

            if(category) {
                return res.status(200).json({
                    data: category,
                    message: "Bạn đã tìm Thể loại thành công!"
                })
            } else {
                return res.status(500).json({
                    message: "Bạn đã tìm Thể loại thất bại!"
                })
            }

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }
    }
}