const Order = require('../../model/Order');
const Product = require('../../model/SanPham');  // Import model sản phẩm
require('dotenv').config();
const nodemailer = require('nodemailer');
const moment = require('moment');
const urlBackend = process.env.VITE_BACKEND_URL
module.exports = {

    historyOrderByIdKH: async (req, res) => {
        try {

            const { page, limit, idKH, sort, order } = req.query; 
    
            // Chuyển đổi thành số
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);
    
            // Tính toán số bản ghi bỏ qua
            const skip = (pageNumber - 1) * limitNumber;

            // tang/giam
            let sortOrder = 1; // tang dn
            if (order === 'desc') {
                sortOrder = -1; 
            }

            let findOrder = await Order.find({ idKhachHang: idKH })
                .skip(skip)
                .limit(limitNumber)
                .populate({
                path: 'products._idSP', // Đường dẫn tới _idSP trong products
                model: 'SanPham',       // Model liên kết
                // select: 'name price',   // Chỉ lấy các trường cần thiết từ SanPham (nếu cần)
                }) 
                .sort({ [sort]: sortOrder })
                
            // Tính tổng 
            let totalOrder = await Order.countDocuments({ idKhachHang: idKH });
            let totalPage = Math.ceil(totalOrder / limitNumber)

            if(findOrder){
                return res.status(200).json({
                    message: "Tìm Order thành công!",
                    errCode: 0,
                    data: {
                        findOrder: findOrder,
                        totalOrder: totalOrder,  // Tổng số Order cho sản phẩm này
                        totalPages: totalPage,  // Tổng số trang
                        currentPage: pageNumber,  // Trang hiện tại
                    }
                })
            } else {
                return res.status(500).json({
                    message: "Tìm Order thất bại!",                
                    errCode: -1,
                })
            } 
        } catch (error) {
            return res.status(500).json({
                message: 'Đã xảy ra lỗi!',
                error: error.message,
            });
        }
    },

    handleHuyOrder: async (req, res) => {
        try {
            let id = req.query.idOrder

            let checkOrder = await Order.findById({_id: id})

            if (!checkOrder) {
                return res.status(404).json({
                    message: "Đơn hàng không tồn tại!",
                    errCode: -1,
                });
            }

            if (checkOrder && checkOrder.TinhTrangThanhToan === 'Đã Thanh Toán') {
                // Nếu TinhTrangThanhToan đang là "Đã thanh toán", tiến hành cập nhật
                let updateOrder = await Order.updateOne(
                    { _id: id },
                    { TinhTrangThanhToan: 'Chờ hoàn tiền', TrangThaiHuyDon: 'Đã Hủy' }
                )
                if(updateOrder){
                    return res.status(200).json({
                        message: "Hủy đơn hàng thành công!",
                        errCode: 0,
                        data: updateOrder
                    })
                } else {
                    return res.status(500).json({
                        message: "Hủy đơn hàng thất bại!",                
                        errCode: -1,
                    })
                } 
            } else {
                // Nếu không phải là "Đã thanh toán", không cập nhật
                let updateOrder = await Order.updateOne(
                    { _id: id },
                    { TrangThaiHuyDon: 'Đã Hủy' }
                );
                if(updateOrder){
                    return res.status(200).json({
                        message: "Hủy đơn hàng thành công!",
                        errCode: 0,
                        data: updateOrder
                    })
                } else {
                    return res.status(500).json({
                        message: "Hủy đơn hàng thất bại!",                
                        errCode: -1,
                    })
                } 
            }          
        } catch (error) {
            return res.status(500).json({
                message: 'Đã xảy ra lỗi!',
                error: error.message,
            });
        }
    },

    historyOrderAll: async (req, res) => {
        try {

            const { page, limit, sort, order, tenKH } = req.query; 
    
            // Chuyển đổi thành số
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);
    
            // Tính toán số bản ghi bỏ qua
            const skip = (pageNumber - 1) * limitNumber;

            // tang/giam
            let sortOrder = 1; // tang dn
            if (order === 'desc') {
                sortOrder = -1; 
            }

            // Tạo query tìm kiếm
            const query = {};
            if (tenKH) {
                const searchKeywords = tenKH.trim().split(/\s+/).map(keyword => {
                    const normalizedKeyword = keyword.toLowerCase();  // Chuyển tất cả về chữ thường để không phân biệt
                    return {
                        $or: [
                            { firstName: { $regex: normalizedKeyword, $options: 'i' } },  
                            { lastName: { $regex: normalizedKeyword, $options: 'i' } },     
                            { phone: { $regex: normalizedKeyword, $options: 'i' } },     
                            { address: { $regex: normalizedKeyword, $options: 'i' } },     
                        ]
                    };
                }).flat();  // flat() để biến các mảng lồng vào thành một mảng phẳng
            
                query.$and = searchKeywords;  // Dùng $and để tìm tất cả các từ khóa
            }

            let findOrder = await Order.find(query)
                .skip(skip)
                .limit(limitNumber)
                .populate({
                path: 'products._idSP', // Đường dẫn tới _idSP trong products
                model: 'SanPham',       // Model liên kết
                }) 
                .sort({ [sort]: sortOrder })
                
            // Tính tổng 
            let totalDH = await Order.countDocuments(query);
            let totalPage = Math.ceil(totalDH / limitNumber)

            if(findOrder){
                return res.status(200).json({
                    message: "Tìm Order thành công!",
                    errCode: 0,
                    data: {
                        findOrder: findOrder,
                        totalDH: totalDH,  // Tổng số Order
                        totalPages: totalPage,  // Tổng số trang
                        currentPage: pageNumber,  // Trang hiện tại
                    }
                })
            } else {
                return res.status(500).json({
                    message: "Tìm Order thất bại!",                
                    errCode: -1,
                })
            } 
        } catch (error) {
            return res.status(500).json({
                message: 'Đã xảy ra lỗi!',
                error: error.message,
            });
        }
    },

    deleteHistoryOrder: async (req, res) => {
        try {
            const _id = req.params.id
            let xoaTL = await Order.deleteOne({_id: _id})

            if(xoaTL) {
                return res.status(200).json({
                    data: xoaTL,
                    message: "Bạn đã xoá đơn hàng này thành công!"
                })
            } else {
                return res.status(500).json({
                    message: "Bạn đã xoá đơn hàng này thất bại!"
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

    updateOrder: async (req, res) => {
        try {
            let {TinhTrangDonHang, TinhTrangThanhToan, _id, urlTTGH} = req.body

            // let update = await Order.findByIdAndUpdate({_id: _id}, {TinhTrangDonHang, TinhTrangThanhToan})

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

            let productsHtml = '';

            let findOrder = await Order.findById({_id: _id})
                .populate({
                    path: 'products._idSP', // Đường dẫn tới _idSP trong products
                    model: 'SanPham',       // Model liên kết
                })
                .populate('idKhachHang')

            for (const product of findOrder.products) {
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

            const orderStatusColor = {
                "Chưa giao hàng": "#95a5a6",   // Màu xám
                "Đang giao hàng": "#f39c12",    // Màu vàng
                "Đã giao hàng": "#2ecc71",     // Màu xanh
            };
            
            const paymentStatusColor = {
                "Chưa Thanh Toán": "#95a5a6",  // Màu xám
                "Đã Thanh Toán": "#2ecc71",    // Màu xanh
            };

            console.log("TinhTrangDonHang: ", TinhTrangDonHang);
            console.log("TinhTrangThanhToan: ", TinhTrangThanhToan);
            
            // Sử dụng màu sắc cho trạng thái đơn hàng và thanh toán
            const orderStatusStyle = orderStatusColor[findOrder.TinhTrangDonHang] || "#95a5a6";  // Mặc định là màu xám nếu không tìm thấy
            const paymentStatusStyle = paymentStatusColor[findOrder.TinhTrangThanhToan] || "#95a5a6";

            const sendOrderConfirmationEmail = async (toEmail) => {
                // Tạo nội dung email với bảng sản phẩm
                const mailOptions = {
                    from: 'Khắc Tú',
                    to: toEmail,
                    subject: 'Thông báo về trạng thái đơn hàng của bạn.',
                    html: `
                        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <h2 style="text-align: center; color: #2c3e50; font-size: 24px;">Cảm ơn bạn đã đặt hàng!</h2>
                            <p style="color: #34495e; font-size: 18px;">Chào bạn <span style="color: #e74c3c; font-weight: bold; font-style: italic;">${findOrder.lastName} ${findOrder.firstName}</span>,</p>
                            <p style="font-size: 16px;">Đơn hàng của bạn đã được xác nhận.</p>
                            
                            <h3 style="color: #2c3e50; font-size: 20px; text-align: center;">Thông tin sản phẩm đã đặt hàng</h3>                                        
                            <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 20px; background-color: #ffffff;">
                                <thead>
                                    <tr>
                                        <th style="text-align: left; padding: 8px; background-color: #ecf0f1; color: #2c3e50;">Tên sản phẩm</th>
                                        <th style="text-align: left; padding: 8px; background-color: #ecf0f1; color: #2c3e50;">Cấu hình</th>
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
                                <p><strong>Tổng số lượng đặt:</strong> <span style="color: #2980b9;">${findOrder.tongSoLuong}</span> sản phẩm</p>
                                <p><strong>Tổng tiền:</strong> <span style="color: #e74c3c;">${formatCurrency(findOrder.thanhTien)}</span></p>
                                <p><strong>Phí giao hàng:</strong> <span style="color: #2ecc71;">0</span></p>
                                <p><strong>Giảm giá:</strong> <span style="color: #e67e22;">-${formatCurrency(findOrder.soTienGiamGia)}</span> (${findOrder.giamGia}%)</p>
                                <p><strong>Số tiền cần thanh toán:</strong> <span style="color: #e74c3c;">${formatCurrency(findOrder.soTienCanThanhToan)}</span></p>
                            </div>
                
                            <p><strong>Số điện thoại:</strong> ${findOrder.phone}</p>
                            <p><strong>Địa chỉ nhận hàng:</strong> <span style="color: #34495e; font-style: italic;">${findOrder.address}</span></p>
                            <br/>
                                                        
                            <p><strong>Trạng thái đơn hàng:</strong> <span style="color: ${orderStatusStyle}; font-style: italic; font-weight: bold;">${TinhTrangDonHang}</span></p>
                            <p><strong>Trạng thái thanh toán:</strong> <span style="color: ${paymentStatusStyle}; font-style: italic; font-weight: bold;">${TinhTrangThanhToan}</span></p>
                                
                            <p style="text-align: center; font-size: 16px;">Bạn có thể theo dõi đơn hàng tại <a href="https://shopbandodientu.dokhactu.site" style="color: #3498db; text-decoration: none;">WebShop Khắc Tú</a></p>
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

            // Kiểm tra trạng thái đơn hàng: nếu đã giao hàng và chưa thanh toán thì không gửi email
            if (TinhTrangDonHang === 'Đã giao hàng' && TinhTrangThanhToan === 'Chưa Thanh Toán') {
                // Không gửi email vì đơn hàng đã giao nhưng chưa thanh toán
                return res.status(400).json({                        
                    message: "Không thể sửa đơn thành Đã giao hàng mà lại Chưa Thanh Toán"
                });
            } else {
                let update = await Order.findByIdAndUpdate({_id: _id}, {TinhTrangDonHang, TinhTrangThanhToan, urlTTGH})                            
                               
                if(update) {                        
                    await sendOrderConfirmationEmail(findOrder.email);
    
                    return res.status(200).json({
                        data: update,
                        findOrder,
                        message: "Cập nhật đơn hàng thành công!"
                    })
                } else {
                    return res.status(500).json({
                        message: "Cập nhật đơn hàng thất bại!"
                    })
                }
            }            
        } catch (error) {
            return res.status(500).json({
                message: 'Đã xảy ra lỗi!',
                error: error.message,
            });
        }
    },

    doanhThu: async (req, res) => {
        try {
            const orders = await Order.aggregate([
                {
                    $match: {
                        // Lọc các đơn hàng theo điều kiện
                        TinhTrangDonHang: "Đã giao hàng",
                        TinhTrangThanhToan: "Đã Thanh Toán",
                        TrangThaiHuyDon: "Không Hủy"
                    }
                },
                {
                    $project: {
                        year: { $year: "$createdAt" },  // Lấy năm từ createdAt
                        month: { $month: "$createdAt" }, // Lấy tháng từ createdAt
                        day: { $dayOfMonth: "$createdAt" }, // Lấy ngày từ createdAt
                        totalSales: "$soTienCanThanhToan", // Tổng doanh thu
                        status: 1  // Giữ lại trạng thái đơn hàng để tính tổng đơn hàng thành công
                    }
                },
                {
                    $group: {
                        _id: { year: "$year", month: "$month" }, // Nhóm theo năm, tháng, ngày
                        totalSales: { $sum: "$totalSales" }, // Tổng doanh thu
                        totalOrders: { $sum: 1 }  // Tổng số đơn hàng thành công (1 đơn hàng = 1)
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } } // Sắp xếp theo năm, tháng, ngày
            ]);
    
            res.json({ data: orders }); // Trả về dữ liệu doanh thu theo ngày
        } catch (error) {
            res.status(500).send("Error fetching sales data");
        }
    },

    doanhThuTheoNgay: async (req, res) => {
        try {
            const { startDate, endDate } = req.body;            
            console.log('Start Date:', startDate); 
            console.log('End Date:', endDate);                 

            const start = moment(startDate, "DD/MM/YYYY").startOf('day').toDate();
            const end = moment(endDate, "DD/MM/YYYY").endOf('day').toDate();

            console.log('start:', moment(start).format('YYYY/MM/DD HH:mm:ss'));  // Kiểm tra thời gian UTC
            console.log('end:', moment(end).format('YYYY/MM/DD HH:mm:ss'));      // Kiểm tra thời gian UTC
            
            // Kiểm tra có dữ liệu trong khoảng ngày không
            // const ordersInRange = await Order.find({ 
            //     createdAt: { $gte: start, $lte: end },
            //     TinhTrangDonHang: "Đã giao hàng",
            //     TinhTrangThanhToan: "Đã Thanh Toán",
            //     TrangThaiHuyDon: "Không Hủy"
            // });
            // if (ordersInRange.length === 0) {
            //     console.log("Không có đơn hàng trong khoảng thời gian này");
            //     return res.json({ message: "Không có đơn hàng trong khoảng thời gian này" });
            // }

            // console.log("Orders in range:", ordersInRange);
        
            const orders = await Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: start, $lte: end },
                        TinhTrangDonHang: "Đã giao hàng",
                        TinhTrangThanhToan: "Đã Thanh Toán",
                        TrangThaiHuyDon: "Không Hủy"
                    }
                },
                {
                    $project: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Lấy ngày từ createdAt
                        // year: { $year: "$createdAt" },   // Lấy năm
                        // month: { $month: "$createdAt" },  // Lấy tháng
                        // day: { $dayOfMonth: "$createdAt" },  // Lấy ngày trong tháng
                        totalSales: "$soTienCanThanhToan" // Tổng doanh thu
                    }
                },
                {
                    $group: {
                        _id: "$date",  // Nhóm theo ngày
                        // _id: { year: "$year", month: "$month", day: "$day" },  // Nhóm theo năm, tháng, ngày
                        totalSales: { $sum: "$totalSales" },  // Tổng doanh thu của ngày
                        totalOrders: { $sum: 1 }  // Tổng số đơn hàng thành công trong ngày
                    }
                },
                {
                    $sort: { "_id": 1 } // Sắp xếp theo ngày tăng dần
                    // $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } // Sắp xếp theo ngày tăng dần
                }
            ]);
    
            res.json({ data: orders, startDate, endDate }); // Trả về dữ liệu doanh thu theo ngày
        } catch (error) {
            console.error(error);
            res.status(500).send("Lỗi khi lấy dữ liệu doanh thu");
        }
    }
    
}