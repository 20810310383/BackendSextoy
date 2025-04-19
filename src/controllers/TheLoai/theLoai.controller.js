const HangSX = require('../../model/HangSX');
const LoaiSP = require('../../model/LoaiSP');
const SanPham = require('../../model/SanPham');

require('dotenv').config();

module.exports = {

    getTheLoai: async (req, res) => {
        try {
            let { page, limit, TenLoaiSP, sort, order } = req.query; 

            // Chuyển đổi thành số
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);           

            // Tính toán số bản ghi bỏ qua
            const skip = (pageNumber - 1) * limitNumber;

            // Tạo query tìm kiếm
            const query = {};
            if (TenLoaiSP) {
                const searchKeywords = (TenLoaiSP || '')
                const keywordsArray = searchKeywords.trim().split(/\s+/);

                const searchConditions = keywordsArray.map(keyword => ({
                    TenLoaiSP: { $regex: keyword, $options: 'i' } // Tìm kiếm không phân biệt chữ hoa chữ thường
                }));

                query.$or = searchConditions;
            }

            let sortOrder = 1; // tang dn
            if (order === 'desc') {
                sortOrder = -1; 
            }
            console.log("sortOrder: ", sortOrder);      
            
            // const loaisp = await LoaiSP.aggregate([
            //     // Tìm tất cả các thể loại thỏa mãn điều kiện tìm kiếm
            //     {
            //         $match: query
            //     },
            //     // Thực hiện phép join với collection SanPham để lấy tất cả sản phẩm liên kết với thể loại
            //     {
            //         $lookup: {
            //             from: 'sanphams',  // Tên collection sản phẩm
            //             localField: '_id',
            //             foreignField: 'IdLoaiSP',  // Trường liên kết với loại sản phẩm
            //             as: 'products'  // Kết quả join sẽ lưu vào trường `products`
            //         }
            //     },
            //     // Tính toán `totalProducts` là số sản phẩm trong mỗi loại và lấy thêm trường Image
            //     {
            //         $project: {
            //             TenLoaiSP: 1,
            //             Image: 1,  // Thêm trường Image vào kết quả
            //             Icon: 1,  // Thêm trường Image vào kết quả
            //             // totalProducts: { $size: '$products' }  // Đếm số sản phẩm trong mỗi loại
            //             totalProducts: { 
            //                 $toString: { $size: '$products' }  // Chuyển đổi số lượng sản phẩm thành chuỗi
            //             }
            //         }
            //     },
            //     // Sắp xếp theo trường `sort` và `order`
            //     {
            //         $sort: {
            //             [sort]: sortOrder
            //         }
            //     },
            //     // Thực hiện phân trang
            //     {
            //         $skip: skip
            //     },
            //     {
            //         $limit: limitNumber
            //     }
            // ]); 

            let loaisp = await LoaiSP.find(query).skip(skip).limit(limitNumber).sort({ [sort]: sortOrder })

            // Tính tổng số sản phẩm cho mỗi thể loại
            const loaiSPsWithTotal = await Promise.all(
                loaisp.map(async (item) => {
                    const totalProducts = await SanPham.countDocuments({ IdLoaiSP: item._id });
                    return { ...item.toObject(), totalProducts: totalProducts.toString() }; // Kết hợp tổng sản phẩm vào item
                })
            );

            const totalLoaiSP = await LoaiSP.countDocuments(query); // Đếm tổng số chức vụ

            const totalPages = Math.ceil(totalLoaiSP / limitNumber); // Tính số trang

            if(loaisp) {
                return res.status(200).json({
                    message: "Đã tìm ra thể loại",
                    errCode: 0,
                    data: loaiSPsWithTotal,     // Trả về các thể loại có kèm tổng số sản phẩm
                    totalLoaiSP,
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

    createTheLoai: async (req, res) => {
        try {
            let {TenLoaiSP, Icon, Image} = req.body            

            let checkTenTL = await LoaiSP.findOne({TenLoaiSP: TenLoaiSP})
            if(checkTenTL){
                return res.status(200).json({
                    message: "Trùng tên thể loại, Bạn không thể thêm mới!",                
                })
            }

            let createTL = await LoaiSP.create({TenLoaiSP, Icon, Image})

            if(createTL){
                return res.status(200).json({
                    message: "Bạn đã thêm loại sản phẩm thành công!",
                    errCode: 0,
                    data: createTL
                })
            } else {
                return res.status(500).json({
                    message: "Bạn thêm loại sản phẩm thất bại!",                
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

    updateTheLoai: async (req, res) => {
        try {
            let {_id, TenLoaiSP, Icon, Image} = req.body

            let updateTL = await LoaiSP.updateOne({_id: _id},{TenLoaiSP, Icon, Image})

            if(updateTL) {
                return res.status(200).json({
                    data: updateTL,
                    message: "Chỉnh sửa Thể loại thành công"
                })
            } else {
                return res.status(404).json({                
                    message: "Chỉnh sửa Thể loại thất bại"
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

    deleteTheLoai: async (req, res) => {
        try {
            const _id = req.params.id
            let xoaTL = await LoaiSP.deleteOne({_id: _id})

            if(xoaTL) {
                return res.status(200).json({
                    data: xoaTL,
                    message: "Bạn đã xoá Thể loại thành công!"
                })
            } else {
                return res.status(500).json({
                    message: "Bạn đã xoá Thể loại thất bại!"
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
    },

    getHangAndLoai: async (req, res) => {
        try {
            const result = await HangSX.find()
                .populate({
                    path: 'IdLoaiSP',
                    select: 'TenLoaiSP' // Không cần totalProducts từ DB nữa, vì ta sẽ tính lại
                })
                .lean();
    
            // Format lại dữ liệu
            const formatted = await Promise.all(result.map(async (hang) => {
                const loaiList = (hang.IdLoaiSP || []).filter(Boolean);
    
                // Tính totalProducts cho mỗi loại
                const loaiSanPham = await Promise.all(loaiList.map(async (loai) => {
                    const totalProducts = await SanPham.countDocuments({ IdLoaiSP: loai._id });
                    return {
                        _id: loai._id,
                        TenLoaiSP: loai.TenLoaiSP,
                        totalProducts
                    };
                }));
    
                return {
                    _id: hang._id,
                    TenHangSX: hang.TenHangSX,
                    soLuongLoai: loaiSanPham.length,
                    loaiSanPham
                };
            }));
    
            res.json({ data: formatted });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
    
}