const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AccKH = require('../../model/AccKH');
require('dotenv').config();
// Secret key cho JWT

module.exports = {

    doiThongTinKH: async (req, res) => {
        const {_idAcc, email, fullName, address, phone, password, passwordMoi, image} = req.body 

        console.log("image: ", image);
        
        
        // một chuỗi đã được mã hóa có thể lưu vào cơ sở dữ liệu.
        const hashedPassword = await bcrypt.hash(passwordMoi, 10);

        const updateResult = await AccKH.updateOne(
            { _id: _idAcc }, 
            { email, fullName, address, phone, password: hashedPassword, image }
        );
        
        if(updateResult) {
            // Trả về kết quả thành công
            return res.status(200).json({
                message: "Cập nhật tài khoản khách hàng thành công!",
                data: updateResult
            });
        } else {
            return res.status(404).json({                
                message: "Chỉnh sửa thất bại"
            })
        }  
    }
}
