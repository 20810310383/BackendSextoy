const { VNPay, ProductCode, VnpLocale, ignoreLogger } = require('vnpay');
const Order = require('../../model/Order');
const Product = require('../../model/SanPham');  // Import model sản phẩm
const nodemailer = require('nodemailer');
const mongoose = require("mongoose");
const SePayTransaction = require('../../model/SepayTransaction');
const Cart = require('../../model/Cart');
require('dotenv').config();

const vnpay = new VNPay({
    tmnCode: 'ULFF3R39',
    secureSecret: 'X8AEKQN6VRZC43UF5ADL6TGB0Q0IOSTR',
    vnpayHost: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    testMode: true, // tùy chọn, ghi đè vnpayHost thành sandbox nếu là true
    hashAlgorithm: 'SHA512', // tùy chọn

    /**
     * Sử dụng enableLog để bật/tắt logger
     * Nếu enableLog là false, loggerFn sẽ không được sử dụng trong bất kỳ phương thức nào
     */
    enableLog: true, // optional

    /**
     * Hàm `loggerFn` sẽ được gọi để ghi log
     * Mặc định, loggerFn sẽ ghi log ra console
     * Bạn có thể ghi đè loggerFn để ghi log ra nơi khác
     *
     * `ignoreLogger` là một hàm không làm gì cả
     */
    loggerFn: ignoreLogger, // optional
});

// API tạo đơn hàng
const createOrder = async (req, res) => {
    try {
        const { lastName, firstName, email, address, phone, note, fullName,
            products, cartId, thanhTien, soTienCanThanhToan, soTienGiamGia, giamGia, tongSoLuong
        } = req.body;     
        
        console.log("cartId order: ", cartId);
        
        
        // Hàm định dạng tiền tệ VND
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format(amount);
        }

        //---- GỬI XÁC NHẬN ĐƠN HÀNG VỀ EMAIL
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
            }
        });

        // Tạo bảng HTML để hiển thị thông tin đơn hàng
        let productsHtml = '';

        // Lặp qua các sản phẩm trong đơn hàng
        for (const product of products) {
            // Tìm sản phẩm trong cơ sở dữ liệu bằng _idSP
            const productDetails = await Product.findById(product._idSP).exec();

            // Kiểm tra nếu tìm thấy sản phẩm
            if (productDetails) {
                // Thêm thông tin sản phẩm vào bảng HTML
                productsHtml += `
                    <tr>
                        <td>${productDetails.TenSP}</td>  
                        <td>${product.quantity}</td>  
                        <td>${formatCurrency(product.price)}</td>  <!-- Giá mỗi sản phẩm -->
                        <td>${formatCurrency(product.quantity * product.price)}</td>  <!-- Tổng tiền cho sản phẩm -->
                    </tr>
                `;

                // Cập nhật SoLuongBan của sản phẩm
                productDetails.SoLuongBan += product.quantity;  // Cộng thêm số lượng bán
                await productDetails.save();  // Lưu lại sản phẩm đã cập nhật
            }
        }       
       
        const sendOrderConfirmationEmail = async (toEmail) => {
            // Tạo nội dung email với bảng sản phẩm
            const mailOptions = {
                from: ' Admin',
                to: toEmail,
                subject: '🎉 Xác nhận đơn hàng của bạn! 🎉',
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <h2 style="text-align: center; color: #2c3e50; font-size: 24px;">💖 Cảm ơn bạn đã đặt hàng! 💖</h2>
                        <p style="color: #34495e; font-size: 18px;">Xin chào <span style="color: #e74c3c; font-weight: bold; font-style: italic;">${lastName} ${firstName}</span>,</p>
                        <p style="font-size: 16px;">🎊 Đơn hàng của bạn đã được xác nhận! 🎊</p>
                        
                        <h3 style="color: #2c3e50; font-size: 20px; text-align: center;">🛒 Thông tin sản phẩm đã đặt hàng 🛍️</h3>                                        
                        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 20px; background-color: #ffffff;">
                            <thead>
                                <tr>
                                    <th style="text-align: left; padding: 8px; background-color: #ecf0f1; color: #2c3e50;">📦 Tên sản phẩm</th>
                                    <th style="text-align: left; padding: 8px; background-color: #ecf0f1; color: #2c3e50;">🔢 Số lượng</th>
                                    <th style="text-align: left; padding: 8px; background-color: #ecf0f1; color: #2c3e50;">💰 Đơn giá</th>
                                    <th style="text-align: left; padding: 8px; background-color: #ecf0f1; color: #2c3e50;">🧾 Tổng tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productsHtml}
                            </tbody>
                        </table>
        
                        <div style="background-color: #fff; padding: 15px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                            <p><strong>📦 Tổng số lượng đặt:</strong> <span style="color: #2980b9;">${tongSoLuong}</span> sản phẩm</p>
                            <p><strong>💰 Tổng tiền:</strong> <span style="color: #e74c3c;">${formatCurrency(thanhTien)}</span></p>
                            // <p><strong>🚚 Phí giao hàng:</strong> <span style="color: #2ecc71;"> 30.000đ</span></p>
                            // <p><strong>🎁 Giảm giá:</strong> <span style="color: #e67e22;">-${formatCurrency(soTienGiamGia)}</span> </p>
                            <p><strong>💵 Số tiền cần thanh toán:</strong> <span style="color: #e74c3c; font-weight: bold;">${formatCurrency(soTienCanThanhToan)}</span></p>
                        </div>
            
                        <p><strong>📞 Số điện thoại:</strong> ${phone}</p>
                        <p><strong>🏠 Địa chỉ nhận hàng:</strong> <span style="color: #34495e; font-style: italic;">${address}</span></p>
                        <br/>
                                                               
                        <p style="text-align: center; font-size: 16px;">📦 Bạn có thể theo dõi đơn hàng tại <a href="#" style="color: #3498db; text-decoration: none; font-weight: bold;">WebShop </a></p>
                    </div>
                `
            };
        
            return new Promise((resolve, reject) => {
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        reject(error);
                    } else {
                        console.log('📧 Email sent: ' + info.response);
                        resolve();
                    }
                });
            });
        };
        

        const sendOrderNotificationToAdmin = async (adminEmail) => {
            // Gửi email thông báo đơn hàng mới đến Admin
            // Email chứa thông tin khách hàng và danh sách sản phẩm
        
            const mailOptions = {
                from: 'Hệ Thống WebShop',
                to: adminEmail,  // Email Admin nhận thông báo
                subject: '🔔 Đơn hàng mới vừa được đặt',
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <h2 style="text-align: center; color: #e74c3c; font-size: 24px;">📦 Đơn hàng mới</h2>
                        <p style="font-size: 16px;">Một khách hàng vừa đặt hàng thành công trên hệ thống.</p>
                        
                        <h3 style="color: #2c3e50; font-size: 20px;">👤 Thông tin khách hàng</h3>
                        <p><strong>Họ và tên:</strong> <span style="color: #2980b9;">${lastName} ${firstName}</span></p>
                        <p><strong>Số điện thoại:</strong> <span style="color: #27ae60;">${phone}</span></p>
                        <p><strong>Địa chỉ giao hàng:</strong> <span style="color: #34495e;">${address}</span></p>
        
                        <h3 style="color: #2c3e50; font-size: 20px;">🛒 Thông tin đơn hàng</h3>
                        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; background-color: #ffffff;">
                            <thead>
                                <tr>
                                    <th style="text-align: left; padding: 8px; background-color: #ecf0f1; color: #2c3e50;">Sản phẩm</th>
                                    <th style="text-align: left; padding: 8px; background-color: #ecf0f1; color: #2c3e50;">Số lượng</th>
                                    <th style="text-align: left; padding: 8px; background-color: #ecf0f1; color: #2c3e50;">Đơn giá</th>
                                    <th style="text-align: left; padding: 8px; background-color: #ecf0f1; color: #2c3e50;">Tổng</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${productsHtml} <!-- Danh sách sản phẩm -->
                            </tbody>
                        </table>
        
                        <div style="background-color: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); margin-bottom: 20px;">
                            <p><strong>📌 Tổng số lượng:</strong> <span style="color: #2980b9;">${tongSoLuong}</span> sản phẩm</p>
                            <p><strong>💰 Tổng tiền:</strong> <span style="color: #e74c3c;">${formatCurrency(thanhTien)}</span></p>                            
                            <p><strong>💳 Số tiền cần thanh toán:</strong> <span style="color: #e74c3c;">${formatCurrency(soTienCanThanhToan)}</span></p>
                        </div>
        
                        <p style="text-align: center; font-size: 16px;">Admin có thể quản lý đơn hàng tại <a href="#" style="color: #3498db; text-decoration: none;">Trang Quản Lý</a></p>
                    </div>
                `
            };
        
            return new Promise((resolve, reject) => {
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        reject(error);
                    } else {
                        console.log('📧 Email thông báo đơn hàng đã gửi đến Admin: ' + info.response);
                        resolve();
                    }
                });
            });
        };
       

        // Hàm tạo mã ngẫu nhiên
        function generateRandomCode(length = 8) {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // Chữ cái viết hoa và số
            let result = '';
            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * characters.length);
                result += characters[randomIndex];
            }
            return result;
        }

        let mangaunhien = generateRandomCode(6)
        // Tạo đơn hàng mới
        const newOrder = new Order({
            lastName, firstName, email, address, phone, note, 
            products, soTienGiamGia, giamGia, soTienCanThanhToan, thanhTien, tongSoLuong, cartId,
            maDHRandom: mangaunhien // Tạo mã đơn hàng ngẫu nhiên
        });

        // Lưu đơn hàng vào database
        await newOrder.save();

        // Gửi email thông báo đặt hàng thành công
        await sendOrderConfirmationEmail(email);  
        
        // Gửi email thông báo đơn hàng mới đến Admin
        const emailAdmin = 'trannghia271002@gmail.com'
        await sendOrderNotificationToAdmin(emailAdmin)       

        await Cart.findOneAndDelete({ cartId: cartId });

        // Trả về thông tin đơn hàng đã tạo
        return res.status(201).json({
            message: 'Đặt hàng thành công!',
            data: newOrder,  
            _idDH:  newOrder._id,
            mangaunhien:  mangaunhien,
            soTienCanThanhToan: newOrder.soTienCanThanhToan,    
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Đã xảy ra lỗi khi tạo đơn hàng!',
            error: error.message,
        });
    }
};

const findOrderById = async (req, res) => {
    try {
        const idDH = req.query.idDH;
        const order = await Order.findOne({ _id: idDH }).exec();
        if (!order) {
            return { success: false, message: "Order not found!" };
        }
        return res.status(201).json({
            data: order,  
        });
    } catch (error) {
        console.error("Error finding order:", error);
        return { success: false, message: "Internal server error" };
    }
};

const createOrderThanhToanVNPay = async (req, res) => {
    try {
        const { lastName, firstName, email, address, phone, note,
            products, idKhachHang, thanhTien, soTienCanThanhToan, soTienGiamGia, giamGia, tongSoLuong
        } = req.body;

        console.log("lastName, firstName, email, address, phone, note: ", lastName, firstName, email, address, phone, note);
        console.log("products: ", products);
        console.log("idKhachHang: ", idKhachHang);
        console.log(" thanhTien, soTienCanThanhToan, soTienGiamGia, giamGia, tongSoLuong: ", thanhTien, soTienCanThanhToan, soTienGiamGia, giamGia, tongSoLuong); 
        
        // Hàm định dạng tiền tệ VND
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
            }).format(amount);
        }

        //---- GỬI XÁC NHẬN ĐƠN HÀNG VỀ EMAIL
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
            }
        });

        // Tạo bảng HTML để hiển thị thông tin đơn hàng
        let productsHtml = '';

        // Lặp qua các sản phẩm trong đơn hàng
        for (const product of products) {
            // Tìm sản phẩm trong cơ sở dữ liệu bằng _idSP
            const productDetails = await Product.findById(product._idSP).exec();

            // Kiểm tra nếu tìm thấy sản phẩm
            if (productDetails) {
                // Thêm thông tin sản phẩm vào bảng HTML
                productsHtml += `
                    <tr>
                        <td>${productDetails.TenSP}</td>  
                        <td>${product.size}</td>  
                        <td>${product.quantity}</td>  
                        <td>${formatCurrency(product.price)}</td>  <!-- Giá mỗi sản phẩm -->
                        <td>${formatCurrency(product.quantity * product.price)}</td>  <!-- Tổng tiền cho sản phẩm -->
                    </tr>
                `;
            }
        }       

        const sendOrderConfirmationEmail = async (toEmail) => {
            // Tạo nội dung email với bảng sản phẩm
            const mailOptions = {
                from: ' Admin',
                to: toEmail,
                subject: 'Xác nhận đơn hàng của bạn.',
                html: `
                        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <h2 style="text-align: center; color: #2c3e50; font-size: 24px;">Cảm ơn bạn đã đặt hàng!</h2>
                            <p style="color: #34495e; font-size: 18px;">Chào bạn <span style="color: #e74c3c; font-weight: bold; font-style: italic;">${lastName} ${firstName}</span>,</p>
                            <p style="font-size: 16px;">Đơn hàng của bạn đã được xác nhận.</p>
                            
                            <h3 style="color: #2c3e50; font-size: 20px; text-align: center;">Thông tin sản phẩm đã đặt hàng</h3>                                        
                            <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 20px; background-color: #ffffff;">
                                <thead>
                                    <tr>
                                        <th style="text-align: left; padding: 8px; background-color: #ecf0f1; color: #2c3e50;">Tên sản phẩm</th>
                                        <th style="text-align: left; padding: 8px; background-color: #ecf0f1; color: #2c3e50;">Kích thước</th>
                                        <th style="text-align: left; padding: 8px; background-color: #ecf0f1; color: #2c3e50;">Số lượng</th>
                                        <th style="text-align: left; padding: 8px; background-color: #ecf0f1; color: #2c3e50;">Đơn giá</th>
                                        <th style="text-align: left; padding: 8px; background-color: #ecf0f1; color: #2c3e50;">Tổng tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${productsHtml}
                                </tbody>
                            </table>

                            <div style="background-color: #fff; padding: 15px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                                <p><strong>Tổng số lượng đặt:</strong> <span style="color: #2980b9;">${tongSoLuong}</span> sản phẩm</p>
                                <p><strong>Tổng tiền:</strong> <span style="color: #e74c3c;">${formatCurrency(thanhTien)}</span></p>
                                <p><strong>Phí giao hàng:</strong> <span style="color: #2ecc71;">0</span></p>
                                <p><strong>Giảm giá:</strong> <span style="color: #e67e22;">-${formatCurrency(soTienGiamGia)}</span>  </p>
                                <p><strong>Số tiền cần thanh toán:</strong> <span style="color: #e74c3c;">${formatCurrency(soTienCanThanhToan)}</span></p>
                            </div>
                
                            <p><strong>Số điện thoại:</strong> ${phone}</p>
                            <p><strong>Địa chỉ nhận hàng:</strong> <span style="color: #34495e; font-style: italic;">${address}</span></p>
                            <br/>
                                                                                   
                            <p style="text-align: center; font-size: 16px;">Bạn có thể theo dõi đơn hàng tại <a href="https://shopbandodientu.dokhactu.site" style="color: #3498db; text-decoration: none;">WebShop  Admin</a></p>
                        </div>
                    `
            };

            return new Promise((resolve, reject) => {
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        reject(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                        resolve();
                    }
                });
            });
        };


        
       

        // Tạo đơn hàng mới
        const newOrder = new Order({
            lastName, firstName, email, address, phone, note, products, soTienGiamGia, giamGia, soTienCanThanhToan, thanhTien, tongSoLuong, idKhachHang: idKhachHang || null
        });

        // Lưu đơn hàng vào database
        await newOrder.save();

        // Gửi email thông báo đặt hàng thành công
        await sendOrderConfirmationEmail(email);

        // Lấy returnUrl từ frontend gửi lên, nếu không có thì sử dụng mặc định
        // const returnUrl = req.body?.returnUrl || 'https://backend-bandodientu-node.dokhactu.site/api/order/vnpay_return';
        const returnUrl = req.body?.returnUrl || 'https://backend-nodejs-dodientu.dokhactu.site/api/order/vnpay_return';
        console.log("newOrder._id.toString(): ", newOrder._id.toString());
        
        // Tạo URL thanh toán
        const paymentUrl = vnpay.buildPaymentUrl({
            vnp_Amount: soTienCanThanhToan,
            vnp_IpAddr:
                req.headers['x-forwarded-for'] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||
                req.ip,
            vnp_TxnRef: newOrder._id.toString(),
            vnp_OrderInfo: `Thanh toan don hang ${newOrder._id}`,
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: returnUrl, // Đường dẫn nên là của frontend
            vnp_Locale: VnpLocale.VN,
        });

        // Cập nhật số lượng tồn kho và số lượng bán cho từng sản phẩm
        for (let product of products) {
            const { _idSP, size, quantity } = product;

            // Tìm sản phẩm theo _idSP
            const productData = await Product.findById(_idSP);

            if (productData) {
                console.log(`Found product: ${productData.TenSP}`);

                // Kiểm tra xem sản phẩm có kích thước (size) nào khớp với size đã đặt không
                let updated = false;

                // Duyệt qua các kích thước (sizes) của sản phẩm
                for (let sizeData of productData.sizes) {
                    if (sizeData.size === size) {
                        console.log(`Updating size ${sizeData.size} with quantity ${quantity}`);

                        // Giảm số lượng tồn kho của size đã đặt
                        if (sizeData.quantity >= quantity) {
                            sizeData.quantity -= quantity;
                            productData.SoLuongBan += quantity;
                            updated = true;
                            break; // Dừng vòng lặp khi đã tìm thấy size tương ứng
                        } else {
                            console.log(`Not enough stock for size ${sizeData.size}`);
                            return res.status(400).json({ message: `Không đủ số lượng cho size ${sizeData.size}` });
                        }
                    }
                }

                // Nếu đã cập nhật size thì tính lại tổng số lượng tồn kho của sản phẩm
                if (updated) {
                    // Cập nhật lại SoLuongTon (tổng số lượng tồn kho)
                    productData.SoLuongTon = productData.sizes.reduce((total, size) => total + size.quantity, 0);
                    console.log(`Updated stock for product: ${productData.TenSP}, new SoLuongTon: ${productData.SoLuongTon}`);

                    // Lưu lại thông tin sản phẩm đã cập nhật
                    await productData.save();
                }
            } else {
                console.log(`Product not found: ${ _idSP}`);
            }
        }

        // Trả về thông tin đơn hàng đã tạo
        return res.status(201).json({
            message: 'Đặt hàng thành công!',
            data: newOrder,
            paymentUrl
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Đã xảy ra lỗi khi tạo đơn hàng!',
            error: error.message,
        });
    }
};

const updateCongTienKhiNap = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        await session.startTransaction();

        const sePayWebhookData = {
            id: parseInt(req.body.id),
            gateway: req.body.gateway,
            transactionDate: req.body.transactionDate,
            accountNumber: req.body.accountNumber,
            subAccount: req.body.subAccount,
            code: req.body.code,
            content: req.body.content,
            transferType: req.body.transferType,
            description: req.body.description,
            transferAmount: parseFloat(req.body.transferAmount),
            referenceCode: req.body.referenceCode,
            accumulated: parseInt(req.body.accumulated),
        };

        // nếu SePayTransaction có hơn 1 giao dịch collection 
        if (await SePayTransaction.countDocuments() > 0) {
            const existingTransaction = await SePayTransaction.findOne({
                _id: sePayWebhookData.id,
            });
            if (existingTransaction) {
                return res.status(400).json({
                    message: "transaction này đã thực hiện giao dịch",
                });
            }
        }

        // api chứng thực
        const pattern = process.env.SEPAY_API_KEY;
        const authorizationAPI = req.headers.authorization;
        const apiKey = authorizationAPI.split(" ")[1];

        // kiểm tra xác thực api
        if (pattern === apiKey) {
            // Tạo lịch sử giao dịch
            const newTransaction = await SePayTransaction.create({
                _id: sePayWebhookData.id,
                gateway: sePayWebhookData.gateway,
                transactionDate: sePayWebhookData.transactionDate,
                accountNumber: sePayWebhookData.accountNumber,
                subAccount: sePayWebhookData.subAccount,
                code: sePayWebhookData.code,
                content: sePayWebhookData.content,
                transferType: sePayWebhookData.transferType,
                description: sePayWebhookData.description,
                transferAmount: sePayWebhookData.transferAmount,
                referenceCode: sePayWebhookData.referenceCode,
            });            

            // const matchContent = sePayWebhookData.content.match(/dh([a-f0-9]{24})/);
            const matchContent = sePayWebhookData.content.match(/DH([a-zA-Z0-9]{6,30})/);
            console.log("matchContent: ", matchContent);                
            const idOrder = matchContent[0].replace("DH", "");
            console.log("idOrder: ", idOrder);           
            
            // Tìm đơn hàng trong database
            const order = await Order.findOne({ 
                maDHRandom: new RegExp(`^${idOrder}$`, "i")
             }).session(session);
            if (!order) {
                res.status(404).json({ message: "Không tìm thấy đơn hàng." });
            }

            // Kiểm tra số tiền thanh toán có khớp với số tiền cần thanh toán không
            if (Math.round(order.soTienCanThanhToan) !== sePayWebhookData.transferAmount) {
                return res.status(404).json({ message: "Số tiền thanh toán không khớp" });
            }
            
            const updatedUser = await Order.findOneAndUpdate(
                // { _id: idOrder },
                // { maDHRandom: idOrder },
                { maDHRandom: new RegExp(`^${idOrder}$`, "i") }, // i là flag để không phân biệt hoa thường
                {
                    $set: { TinhTrangThanhToan: "Đã Thanh Toán" },
                    $push: {
                        transactionHistory: {
                            date: new Date(),
                            amount: sePayWebhookData.transferAmount,
                            type: "deposit",
                            reference: sePayWebhookData.id,
                        },
                    },
                },
                { new: true, session }
            );

            if (!updatedUser) {
                return res
                    .status(404)
                    .json({ message: "User account not found" });
            }

            // Gửi email thông báo
            const emailContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thông báo thanh toán thành công</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            padding: 30px;
            max-width: 600px;
            margin: 0 auto;
        }
        h2 {
            color: #28a745;
            text-align: center;
        }
        .order-info {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 5px;
            margin-top: 20px;
            border: 1px solid #ddd;
        }
        .order-info p {
            margin: 10px 0;
            font-size: 1.1em;
        }
        .order-info .amount {
            font-weight: bold;
            color: #28a745;
        }
        .icon {
            font-size: 30px;
            color: #28a745;
            margin-right: 10px;
        }
        .footer {
            margin-top: 30px;
            font-size: 0.9em;
            color: #777;
            text-align: center;
        }
        .highlight {
            color: #007bff;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2><span class="icon">✔️</span> Thanh toán thành công</h2>
        <p>Kính gửi quý khách,</p>
        <p>Chúng tôi vui mừng thông báo rằng thanh toán cho đơn hàng <strong>${order.maDHRandom}</strong> đã được xác nhận thành công.</p>
        
        <div class="order-info">
            <p><strong>Số tiền thanh toán:</strong> <span class="amount">${sePayWebhookData.transferAmount} VND</span></p>
            <p><strong>Trạng thái thanh toán:</strong> <span class="highlight">Đã Thanh Toán</span></p>
        </div>
        
        <div class="footer">
            <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
            <p><strong>Đội ngũ hỗ trợ khách hàng</strong></p>
        </div>
    </div>
</body>
</html>
`;

            await sendEmail(order.email, 'Thông báo thanh toán thành công', emailContent);


            await session.commitTransaction();

            return res.status(200).json({
                success: true,
                newBalance: updatedUser.TinhTrangThanhToan,
                processedAt: new Date().toISOString(),
                message: `Thanh toán thành công`,
            });
        }
        return res.status(400).json({ message: "Invalid transaction" });
    } catch (error) {
        await session.abortTransaction(); // Hủy giao dịch nếu có lỗi
        console.error("Lỗi:", error);
        return res.status(500).json({ message: error.message || "Internal Server Error" });
    } finally {
        session.endSession();
    }
};

// Kích thước nodemailer (Sử dụng Gmail ví dụ)
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
    }
});

// Hàm gửi email
const sendEmail = (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        html: text,
    };

    return transporter.sendMail(mailOptions);
};


module.exports = { createOrder, createOrderThanhToanVNPay, updateCongTienKhiNap, findOrderById };