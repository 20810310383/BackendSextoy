const express = require("express");
// import { createOrder } from '../controllers/Order/order.controller';
// import { deleteHistoryOrder, doanhThu, handleHuyOrder, historyOrderAll, historyOrderByIdKH, updateOrder } from '../controllers/Order/history.order.controller';
const { createOrder, createOrderThanhToanVNPay, updateCongTienKhiNap, findOrderById } = require('../controllers/Order/order.controller');
const { deleteHistoryOrder, doanhThu, handleHuyOrder, historyOrderAll, historyOrderByIdKH, updateOrder, doanhThuTheoNgay } = require('../controllers/Order/history.order.controller');
const { IpnFailChecksum, VNPay, IpnOrderNotFound, IpnInvalidAmount, InpOrderAlreadyConfirmed, IpnSuccess, IpnUnknownError, ignoreLogger, VerifyReturnUrl } = require("vnpay");
const Order = require("../model/Order");


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
const router = express.Router();

// find all hang sx
router.post("/dat-hang", createOrder );
router.post("/dat-hang-thanh-toan-vnpay", createOrderThanhToanVNPay );
router.post("/dat-hang-thanh-toan-sepay", updateCongTienKhiNap );

router.get("/find-all-order", historyOrderByIdKH)
router.get("/find-one-order", findOrderById)

router.get("/find-all-history-order", historyOrderAll)

router.post("/huy-order", handleHuyOrder );

router.delete("/delete-history-order/:id", deleteHistoryOrder );

router.put("/update-order", updateOrder );

router.get("/sales-by-month", doanhThu );
router.post("/thong-ke-theo-ngay", doanhThuTheoNgay );

router.get('/vnpay_return', async (req, res) => {
    const vnp_TxnRef = req.query.vnp_TxnRef; // Lấy mã giao dịch từ callback
    const vnp_ResponseCode = req.query.vnp_ResponseCode; // Lấy mã phản hồi từ VNPay

    console.log("vnp_TxnRef: ", vnp_TxnRef);
    
    if (vnp_ResponseCode === '00') { // '00' là mã thành công
        // So sánh vnp_TxnRef với _id trong model Order
        const order = await Order.findById(vnp_TxnRef);
        if (order) {
            // Cập nhật trạng thái đơn hàng
            order.TinhTrangThanhToan = 'Đã Thanh Toán';
            await order.save();

            res.render('tbThanhToan.ejs');
            // res.status(200).json({
            //     message: 'Thanh toán thành công',
            //     redirectUrl: '/mycart'
            // });
        } else {
            res.status(404).send('Không tìm thấy đơn hàng');
        }
    } else {
        res.send('Thanh toán không thành công, đã đặt đơn nhưng chưa được thanh toán');
        // res.status(400).json({
        //     message: 'Thanh toán không thành công, đã đặt đơn nhưng chưa được thanh toán',
        //     redirectUrl: '/mycart'
        // });
    }
});

module.exports = router;