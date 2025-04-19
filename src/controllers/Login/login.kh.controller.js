const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AccKH = require('../../model/AccKH');
require('dotenv').config();
// Secret key cho JWT
const JWT_SECRET = process.env.JWT_SECRET; 
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Tạo transporter để gửi email
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const defaultVoucherId = new mongoose.Types.ObjectId("673f97124d3518d5ed8a1489");   // mặc định giảm 2%

module.exports = {

    loginAccKH: async (req, res) => {
        const {email, password} = req.body

        try {
            // Tìm admin bằng email
            const admin = await AccKH.findOne({ email });
            if (!admin) {
                return res.status(401).json({ message: 'Email không tồn tại' });
            }

            if (!admin.isActive) {
                return res.status(400).json({
                    message: "Tài khoản vi phạm bị khóa hoặc Tài khoản chưa được xác thực. Vui lòng kiểm tra mã OTP."
                });
            }

            let messError = `Tài khoản này vi phạm quy định của trang và đang bị khóa! ` + '\n' + `Vui lòng liên hệ Admin!`
            if(admin.isActive === false) {
                return res.status(401).json({ message: messError });
            }

            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            console.log("admin.password: ",admin.password);
            console.log("password: ",password);
            console.log("hashedPassword: ",hashedPassword);
            console.log('EXPIRESIN:', process.env.EXPIRESIN);


            // So sánh mật khẩu với bcrypt
            const isMatch = await bcrypt.compare(password, admin.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Mật khẩu không chính xác' });
            }            

            // Tạo token JWT
            const token = jwt.sign(
                { adminId: admin._id, email: admin.email },
                JWT_SECRET,
                { expiresIn: process.env.EXPIRESIN } // Thời gian hết hạn của token
            );

             // Lưu token vào cookie
            res.cookie('token', token, {
                httpOnly: true, // Bảo mật hơn khi chỉ có server mới có thể truy cập cookie này
                secure: process.env.NODE_ENV === 'production', // Chỉ cho phép cookie qua HTTPS nếu là production
                maxAge: parseInt(process.env.MAXAGE), // 1 giờ
            });

            // Trả về thông tin admin (có thể trả về thông tin khác tùy nhu cầu)
            res.json({ message: 'Đăng nhập thành công', access_token: token, data: admin });
            console.log(`Đăng nhập thành công với token: ${token}`);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi máy chủ' });
        }
    },

    logoutKH: async (req, res) => {
        try {
            // Xóa cookie chứa token
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // Bảo đảm chỉ xóa cookie qua HTTPS nếu là production
            });
    
            // Trả về phản hồi thành công
            res.status(200).json({ message: 'Bạn đã đăng xuất thành công' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Lỗi máy chủ' });
        }
    },

    registerAccKH: async (req, res) => {
        const { email, password, fullName, address, phone, gender } = req.body;
    
        console.log("email, password, fullName, address, phone, gender: ", email, password, fullName, address, phone, gender);
        
        try {
            // Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu chưa
            let check = await AccKH.findOne({ email: email });
    
            if (check) {

                if (check.isActive) {
                    return res.status(400).json({
                        success: false,
                        message: 'Tài khoản đã tồn tại và đã được kích hoạt. Bạn không thể đăng ký lại!'
                    });
                } else {
                    // Nếu tài khoản tồn tại nhưng chưa kích hoạt, xóa OTP cũ (nếu có) trước khi tạo mã OTP mới
                    check.otp = null;  // Xóa OTP cũ
                    check.otpExpires = null;  // Xóa thời gian hết hạn OTP cũ
                    await check.save();
    
                    console.log("Xóa mã OTP cũ, tạo mã OTP mới");
                }
            } else {
                // Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu
                const hashedPassword = await bcrypt.hash(password, 10);
    
                // Tạo tài khoản mới
                check = await AccKH.create({
                    email, password: hashedPassword, fullName, address, phone, gender, IdVoucher: defaultVoucherId
                });
            }
    
            // Tạo mã OTP ngẫu nhiên
            const otp = crypto.randomInt(100000, 999999);  // Mã OTP có 6 chữ số
    
            // Lưu OTP và thời gian hết hạn vào cơ sở dữ liệu của tài khoản
            check.otp = otp;
            check.otpExpires = Date.now() + 300000; // Mã OTP có hiệu lực trong 5 phút
            await check.save();
    
            // Gửi OTP qua email
            const mailOptions = {
                from: 'Khắc Tú',  // Đổi thành tên người gửi nếu cần
                to: email,  // Gửi tới email người dùng đăng ký
                subject: 'Mã OTP Đăng ký tài khoản',
                text: `Mã OTP của bạn là: ${otp}. Mã này có hiệu lực trong 5 phút.`,
            };
    
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Lỗi khi gửi email OTP: ', error);
                    return res.status(500).json({
                        success: false,
                        message: "Lỗi khi gửi email OTP!"
                    });
                }
                // Phản hồi khi gửi thành công
                return res.status(200).json({
                    success: true,
                    message: "Mã OTP đã được gửi đến email của bạn. Vui lòng xác nhận OTP để xác nhận đăng ký tài khoản!"
                });
            });
        } catch (error) {
            console.error('Lỗi trong quá trình đăng ký tài khoản: ', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    },
    

    registerAccKH1: async (req, res) => {

        const {email, password, fullName, address, phone, gender} = req.body     
        
        console.log("email, password, fullName, address, phone, gender: ", email, password, fullName, address, phone, gender);
        
       try {
            const check = await AccKH.findOne({email: email})

            // if (check) {
            //     // Kiểm tra xem tài khoản có bị xóa không
            //     if (check.deleted) {
            //         // Tài khoản đã bị xóa (xóa mềm), phục hồi tài khoản này
            //         await AccKH.restore({ _id: check._id });
            //         check = await AccKH.findOne({ email: email }); // Lấy lại thông tin tài khoản sau khi phục hồi
            //     } else {
            //         return res.status(400).json({
            //             message: "Tồn tại tài khoản!"
            //         });
            //     }
            // }

            if(check) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Tài Khoản Đã Tồn Tại! Vui Lòng Chọn Email Khác!' 
                });
            } else {
                // một chuỗi đã được mã hóa có thể lưu vào cơ sở dữ liệu.
                const hashedPassword = await bcrypt.hash(password, 10);

                let dangKy = await AccKH.create({
                    email, password: hashedPassword, fullName, address, phone, gender
                })        
                return res.status(201).json({ 
                    success: true, 
                    message: 'Đăng ký tài khoản thành công', 
                    data: dangKy 
                });
            }
        } catch (error) {
            return res.status(500).json({ success: false , message: error });
        }
    },

    xacThucOTP: async (req, res) => {
        const { otp, email } = req.body;
    
        console.log("otp, email: ", otp, email);
        
        try {
            const user = await AccKH.findOne({ email: email });
    
            if (!user) {
                return res.status(400).json({success: false, message: "Người dùng không tồn tại!" });
            }
    
            // Kiểm tra mã OTP và thời gian hết hạn
            if (user.otp !== otp) {
                return res.status(400).json({success: false, message: "Mã OTP không đúng!" });
            }
    
            if (Date.now() > user.otpExpires) {
                return res.status(400).json({success: false, message: "Mã OTP đã hết hạn!" });
            }
    
            // Nếu OTP hợp lệ, kích hoạt tài khoản
            user.isActive = true;
            user.otp = null;  // Xóa mã OTP sau khi xác thực
            user.otpExpires = null;  // Xóa thời gian hết hạn OTP
            await user.save();
    
            res.status(200).json({success: true, message: "Xác thực OTP thành công! Bạn có thể đăng nhập." });
    
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
    },

    checkTrangThaiIsActive: async (req, res) => {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Không có token xác thực' });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const admin = await AccKH.findById(decoded.adminId);
            if (!admin) {
                return res.status(404).json({ message: 'Tài khoản không tồn tại' });
            }

            if (!admin.isActive) {
                return res.status(400).json({ message: 'Tài khoản đã bị khóa' });
            }

            res.status(200).json({ message: 'Tài khoản vẫn hoạt động' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
}