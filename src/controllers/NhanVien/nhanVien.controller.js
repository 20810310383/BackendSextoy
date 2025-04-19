const mongoose = require('mongoose');  // Đảm bảo bạn đã import mongoose
const AccAdmin = require('../../model/AccAdmin');
const Role = require('../../model/Role');
require('dotenv').config();

module.exports = {

    getAccAdmin: async (req, res) => {
        try {
            const { page, limit, fullName } = req.query; 
    
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
    
            let acc = await AccAdmin.find(query).populate("roleId").skip(skip).limit(limitNumber)

            const totalAccAdmin = await AccAdmin.countDocuments(query); // Đếm tổng số chức vụ

            const totalPages = Math.ceil(totalAccAdmin / limitNumber); // Tính số trang
                       
            if(acc) {
                return res.status(200).json({
                    message: "Đã tìm ra acc admin",
                    errCode: 0,
                    data: acc,
                    totalAccAdmin,
                    totalPages,
                    currentPage: pageNumber,
                })
            } else {
                return res.status(500).json({
                    message: "Tìm thất bại!",
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
  
    updateAccAdmin: async (req, res) => {
        try {
            const { id, roleId, lastName, firstName } = req.body;                               
                
            const updateResult = await AccAdmin.updateOne(
                { _id: id }, // Điều kiện tìm kiếm tài liệu cần cập nhật
                { roleId, lastName, firstName }
            );

            if(updateResult) {
                // Trả về kết quả thành công
                return res.status(200).json({
                    message: "Cập nhật phân quyền cho nhân viên thành công!",
                    data: updateResult
                });
            } else {
                return res.status(404).json({                
                    message: "Chỉnh sửa thất bại"
                })
            }                    
        } catch (error) {
            console.error("Lỗi khi cập nhật phân quyền cho nhân viên:", error);
            return res.status(500).json({
                message: "Có lỗi xảy ra.",
                error: error.message
            });
        }
    },
    
    deleteAccAdmin: async (req, res) => {
        try {
            const id = req.params.id
            let xoa = await AccAdmin.deleteOne({_id: id})

            if(xoa) {
                return res.status(200).json({
                    data: xoa,
                    message: "Bạn đã xóa tài khoản nhân viên thành công!"
                })
            } else {
                return res.status(500).json({
                    message: "Bạn đã xóa tài khoản nhân viên thất bại!"
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

    khoaAccAdmin: async (req, res) => {
        try {
            // const id = req.params.id
            const { id, isActive } = req.body;

            const updatedAccount = await AccAdmin.findByIdAndUpdate(id, { isActive }, { new: true });

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

    getRole: async (req, res) => {
        try {           
            const query = {};
            
            let acc = await Role.find(query)           
                       
            if(acc) {
                return res.status(200).json({
                    message: "Đã tìm ra role",
                    errCode: 0,
                    data: acc,                    
                })
            } else {
                return res.status(500).json({
                    message: "Tìm thất bại!",
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

}