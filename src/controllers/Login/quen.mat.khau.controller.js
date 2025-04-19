const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const AccKH = require('../../model/AccKH');
require('dotenv').config();

module.exports = {

    // quên mật khẩu - trả mật khẩu về email tài khoản khách hàng
    quenMatKhauKH: async (req, res) => {
        const { email_doimk } = req.body;
        console.log("email đổi mk: ", email_doimk);
    
        try {
            // Kiểm tra xem tài khoản có tồn tại không
            let tk_doimk = await AccKH.findOne({ email: email_doimk });
            
            if (!tk_doimk) {
                console.log("Không tồn tại tài khoản");
                return res.status(404).json({ message: 'Không tồn tại tài khoản! Vui lòng kiểm tra lại email của bạn.', data: false });
            }
    
            // Tạo mật khẩu ngẫu nhiên
            const newPassword = Math.random().toString(36).slice(-6);
    
            // Mã hóa mật khẩu mới
            const hashedPassword = await bcrypt.hash(newPassword, 10);
    
            // Lưu mật khẩu đã mã hóa vào cơ sở dữ liệu
            tk_doimk.password = hashedPassword;
            await tk_doimk.save();
    
            // Tạo transporter để gửi email
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
    
            // Cấu hình email
            const mailOptions = {
                from: 'Admin', 
                to: email_doimk,
                subject: 'Yêu cầu lấy lại mật khẩu',
                text: `Mật khẩu mới của bạn là: ${newPassword}`,
                html: `
                    <p style="color: green;">Mật khẩu mới của bạn là: <strong>${newPassword}</strong></p>
                    <p>Vui lòng đăng nhập với mật khẩu mới này để tiếp tục sử dụng dịch vụ.</p>
                `
            };
    
            // Gửi email với async/await thay vì callback
            await transporter.sendMail(mailOptions);
    
            console.log('Email sent');
            return res.status(200).json({
                data: true,
                message: `Mật khẩu mới đã được gửi tới email của bạn. Vui lòng kiểm tra email ${email_doimk} để lấy lại mật khẩu!`
            });
    
        } catch (error) {
            // Xử lý lỗi khi có lỗi xảy ra trong bất kỳ bước nào
            console.error('Lỗi trong quá trình xử lý:', error);
            return res.status(500).json({ message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.', data: false });
        }
    },
}