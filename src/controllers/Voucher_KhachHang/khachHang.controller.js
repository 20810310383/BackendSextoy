const mongoose = require('mongoose');  // Đảm bảo bạn đã import mongoose
const AccKH = require('../../model/AccKH');
const HopQua = require('../../model/HopQua');
const Order = require('../../model/Order');


require('dotenv').config();

module.exports = {

    getAccKH: async (req, res) => {
        try {
            const { page, limit, fullName, hangTV } = req.query; 
    
            // Chuyển đổi thành số
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);
    
            // Tính toán số bản ghi bỏ qua
            const skip = (pageNumber - 1) * limitNumber;
    
            // Tạo query tìm kiếm
            const query = {};
            if (fullName) {
                const searchKeywords = fullName.trim().split(/\s+/).map(keyword => {
                    const normalizedKeyword = keyword.toLowerCase();  // Chuyển tất cả về chữ thường để không phân biệt
                    return {
                        $or: [
                            { fullName: { $regex: normalizedKeyword, $options: 'i' } },  
                            { email: { $regex: normalizedKeyword, $options: 'i' } },                                 
                            { address: { $regex: normalizedKeyword, $options: 'i' } },                                 
                        ]
                    };
                }).flat();  // flat() để biến các mảng lồng vào thành một mảng phẳng
            
                query.$and = searchKeywords;  // Dùng $and để tìm tất cả các từ khóa
            }
            
            
            if (hangTV) {               
                query.hangTV = hangTV
            }
    
            let accKH = await AccKH.find(query).populate("IdVoucher").skip(skip).limit(limitNumber).lean();  // Trả về object thuần JavaScript

            const totalAccKH = await AccKH.countDocuments(query); // Đếm tổng số chức vụ

            const totalPages = Math.ceil(totalAccKH / limitNumber); // Tính số trang
                       
            // **Thêm dữ liệu đơn hàng thành công**
            const updatedAccKH = await Promise.all(
                accKH.map(async (acc) => {
                    const successfulOrders = await Order.find({
                        TinhTrangDonHang: "Đã giao hàng",
                        TinhTrangThanhToan: "Đã Thanh Toán",
                        idKhachHang: acc._id
                    })

                    // **Làm tròn tổng doanh thu**
                    const totalRevenue = successfulOrders.reduce((sum, order) => sum + order.soTienCanThanhToan, 0);
                    const roundedRevenue = Math.round(totalRevenue);  // Làm tròn đến số nguyên gần nhất

                    return {
                        ...acc,
                        soLuongDonThanhCong: successfulOrders.length,
                        tongDoanhThuThanhCong: roundedRevenue.toLocaleString("vi-VN") + " VNĐ"
                    };
                })
            );

            if(accKH) {
                return res.status(200).json({
                    message: "Đã tìm ra acc kh",
                    errCode: 0,
                    data: updatedAccKH,
                    totalAccKH,
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
  
    updateAccKH: async (req, res) => {
        try {
            const { id, fullName, IdVoucher, quayMayManCount, hangTV } = req.body;
            console.log("id: ", id);
            console.log("fullname: ", fullName);
            console.log("IdVoucher: ", IdVoucher);                           
                
            const updateResult = await AccKH.updateOne(
                { _id: id }, // Điều kiện tìm kiếm tài liệu cần cập nhật
                { IdVoucher, fullName, quayMayManCount, hangTV }
            );

            if(updateResult) {
                // Trả về kết quả thành công
                return res.status(200).json({
                    message: "Cập nhật Voucher cho khách hàng thành công!",
                    data: updateResult
                });
            } else {
                return res.status(404).json({                
                    message: "Chỉnh sửa thất bại"
                })
            }                    
        } catch (error) {
            console.error("Lỗi khi cập nhật Voucher cho khách hàng:", error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message
            });
        }
    },
    
    deleteAccKH: async (req, res) => {
        try {
            const id = req.params.id
            let xoa = await AccKH.deleteOne({_id: id})

            if(xoa) {
                return res.status(200).json({
                    data: xoa,
                    message: "Bạn đã xóa tài khoản khách hàng thành công!"
                })
            } else {
                return res.status(500).json({
                    message: "Bạn đã xóa tài khoản khách hàng thất bại!"
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

    khoaAccKH: async (req, res) => {
        try {
            // const id = req.params.id
            const { id, isActive } = req.body;

            const updatedAccount = await AccKH.findByIdAndUpdate(id, { isActive }, { new: true });

            if (updatedAccount) {
                return res.status(200).json({ message: "Cập nhật thành công", data: updatedAccount });
            } else {
                return res.status(404).json({ message: "Tài khoản không tìm thấy" });
            }

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }
    },

    getOneAccKH: async (req, res) => {
        try {
            const id = req.query.id; 
            console.log("id: ", id);
                            
            let accKH = await AccKH.find({_id: id}).populate("IdVoucher")
                       
            if (!accKH) {
                return res.status(404).json({
                    message: "Không tìm thấy tài khoản khách hàng!",
                    errCode: -1
                });
            }
    
            // Tính tổng số đơn hàng thành công và tổng doanh thu
            const successfulOrders = await Order.find({
                idKhachHang: id,
                TinhTrangDonHang: "Đã giao hàng",
                TinhTrangThanhToan: "Đã Thanh Toán"
            });
    
            const soLuongDonThanhCong = successfulOrders.length;
            const tongDoanhThuThanhCong = Math.floor(successfulOrders.reduce((sum, order) => sum + order.soTienCanThanhToan, 0));
    
            return res.status(200).json({
                message: "Đã tìm ra tài khoản khách hàng",
                errCode: 0,
                data: accKH,
                soLuongDonThanhCong,
                tongDoanhThuThanhCong
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message,
            });
        }        
    },  
    
    quaySoMayMan: async (req, res) => {
        try {
            let { userId } = req.body;
            console.log("userId: ", userId);            
            
            // Lấy thông tin khách hàng
            const user = await AccKH.findById(userId);
    
            // Kiểm tra xem người dùng có còn lượt quay không
            if (user.quayMayManCount <= 0) {
                return res.status(500).json({
                    message: "Bạn đã hết lượt quay số may mắn.",
                    errCode: -1,
                })
            }
    
            // Giảm số lần quay đi 1
            user.quayMayManCount -= 1;
    
            // Lưu lại thay đổi
            await user.save();

            return res.status(200).json({
                message: "Quay số thành công!",
                errCode: 0,
                // prize,  // Trả về phần thưởng
                quayMayManCount: user.quayMayManCount,
            });
                           
        } catch (error) {
            throw new Error(error.message);
        }
    },

    nhanThuong: async (req, res) => {
        try {
            let { userId, IdVoucher } = req.body;
            console.log("userId: ", userId);
            console.log("IdVoucher: ", IdVoucher);
            const voucherId = new mongoose.Types.ObjectId(IdVoucher);

            const user = await AccKH.findById(userId);

            if (!user) {
                return res.status(404).json({
                    message: "Người dùng không tồn tại.",
                    errCode: -1,
                });
            }
    
            // Kiểm tra nếu `IdVoucher` nằm trong danh sách `IdVoucher` của người dùng
            const voucherExists = user.IdVoucher.some(
                // (voucher) => voucher.toString() === IdVoucher
                (voucher) => voucher.toString() === voucherId.toString()
            );
    
            if (voucherExists) {
                return res.status(200).json({
                    message: "Voucher đã tồn tại trong tài khoản. Không thể nhận thêm.",
                    errCode: -1,
                });
            } else {                
                // user.IdVoucher.push(IdVoucher);
                user.IdVoucher = [...user.IdVoucher, IdVoucher];

                // Lưu lại thay đổi
                await user.save();

                return res.status(200).json({
                    message: "Đã nhận phần thưởng!",
                    errCode: 0,                    
                });               
            }                
                           
        } catch (error) {
            throw new Error(error.message);
        }
    },
  
}