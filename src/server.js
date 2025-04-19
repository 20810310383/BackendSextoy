const express = require('express');
const bodyParser = require('body-parser');
const viewEngine = require('./config/viewEngine');
const uploadRouter = require('./routes/uploadRouter');
const adminRouter = require('./routes/loginAdminRouter');
const categoryRouter = require('./routes/theLoaiRouter');
const hangSXRouter = require('./routes/hangSXRouter');
const productRouter = require('./routes/productRouter');
const khRouter = require('./routes/loginKHRouter');
const voucherRouter = require('./routes/voucherRouter');
const orderRouter = require('./routes/orderRouter');
const commentRouter = require('./routes/commentRouter');
const hopQuaRouter = require('./routes/hopQuaRouter');
const cauHoiRouter = require('./routes/cauHoiRouter');
const cartRouter = require('./routes/cartRouter');
const thuegamelienhe = require('./routes/thuegamelienhe');
const connectDB = require('./config/connectDB');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const cron = require('node-cron');
const moment = require('moment');
const WebSocket = require('ws'); // Thêm thư viện WebSocket
const Voucher = require('./model/Voucher');
const cleanUploads = require('./utils/cleanUploads');

require("dotenv").config();

let app = express();
let port = process.env.PORT || 8070;
const hostname = process.env.HOST_NAME;

connectDB();

// Cài đặt CORS
const allowedOrigins = [
    'http://localhost:3022', 
    'http://localhost:3024', 
    
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) { // Dùng includes thay cho indexOf
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,    
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],  // Cho phép phương thức OPTIONS (preflight)
    allowedHeaders: ['Content-Type', 'Authorization', 'upload-type'],
}));
app.options('*', cors()); // Enable preflight requests for all routes



// Config bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Đặt thư mục public/uploads làm public để có thể truy cập
app.use('/uploads', express.static(path.join(__dirname, './public/uploads')));


// Config app
viewEngine(app);

const routes = [
    { path: '/api/accadmin', router: adminRouter },
    { path: '/api/category', router: categoryRouter },
    { path: '/api/hangsx', router: hangSXRouter },
    { path: '/api/product', router: productRouter },
    { path: '/api/acckh', router: khRouter },
    { path: '/api/voucher', router: voucherRouter },
    { path: '/api/order', router: orderRouter },
    { path: '/api/comment', router: commentRouter },
    { path: '/api/hopqua', router: hopQuaRouter },
    { path: '/api/cauhoi', router: cauHoiRouter },
    { path: '/api/cart', router: cartRouter },
    // { path: '/api/lienhethuegame', router: thuegamelienhe },
];
  
routes.forEach(route => app.use(route.path, route.router));

// Sử dụng uploadRouter
app.use("/api/upload", uploadRouter); // Đặt đường dẫn cho upload


// xóa các voucher đã hết  -- sau 10s chạy 1 lần
cron.schedule('*/10 * * * * *', async () => {
    try {
        const now = moment(); // Lấy thời gian hiện tại
        const expiredVouchers = await Voucher.find({
            thoiGianHetHan: { 
                $lt: now.format('DD-MM-YYYY') // So sánh với ngày hiện tại
            }
        });

        if (expiredVouchers.length > 0) {
            console.log(`Có ${expiredVouchers.length} phiếu giảm giá đã hết hạn. Đang xóa...`);
            await Voucher.deleteMany({
                thoiGianHetHan: { 
                    $lt: now.format('DD-MM-YYYY') 
                }
            });
            console.log("Phiếu giảm giá hết hạn đã được xóa thành công.");
        } else {
            console.log("Không tìm thấy Phiếu giảm giá nào hết hạn.");
        }
    } catch (error) {
        console.error("Lỗi khi xóa phiếu giảm giá đã hết hạn:", error);
    }
});

setInterval(cleanUploads, 1 * 60 * 1000);


app.get('/dokhactu', (req, res) => {
    setTimeout(function() {
        throw new Error('loi')
    })
})

app.listen(port, () => {
    console.log("backend nodejs is running on the port:", port, `\n http://localhost:${port}`);
});
