const Cart = require("../../model/Cart");
const SanPham = require("../../model/SanPham");
const Voucher = require("../../model/Voucher");


const addToCart = async (req, res) => {
    try {
        const { _idSP, quantity, cartId } = req.body;

        // Lấy sản phẩm
        const product = await SanPham.findById(_idSP);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        }              

        const priceGoc = product.sizes ?? 0;

        const giaGiam = priceGoc - (priceGoc * (product.GiamGiaSP / 100));
        const giaSauGiam = Math.floor(giaGiam / 1000) * 1000; // Làm tròn xuống 10.000₫ gần nhất

        const price = product.GiamGiaSP > 0 ? giaSauGiam : priceGoc;

        // Tìm cart
        let cart = await Cart.findOne({ cartId });

        if (!cart) {
            // Nếu chưa có, tạo mới
            cart = new Cart({
                cartId,
                products: [{
                    _idSP,
                    quantity,
                    price,
                    priceGoc
                }],
                soTienGiamGia: 0 // ban đầu là 0
            });
        } else {
            // Tìm sản phẩm đã tồn tại trong cart chưa
            const index = cart.products.findIndex(p =>
                p._idSP.toString() === _idSP 
            );

            if (index > -1) {
                const currentQty = cart.products[index].quantity;
                const totalQty = currentQty + quantity;

                // Kiểm tra xem số lượng có vượt quá kho của sản phẩm không
                // if (totalQty > product.quantity) {
                //     return res.status(400).json({
                //         message: `Bạn đã có ${currentQty} sản phẩm này trong giỏ. Tổng vượt kho (${product.quantity}).`
                //     });
                // }

                // Cập nhật số lượng trong giỏ hàng
                cart.products[index].quantity = totalQty;
            } else {
                // Thêm sản phẩm mới vào giỏ
                cart.products.push({
                    _idSP,
                    quantity,
                    price,
                    priceGoc
                });
            }
        }

        // ✅ Cập nhật tổng tiền giỏ hàng
        const tongTienChuaGiam = cart.products.reduce((total, item) => {
            return total + item.price * item.quantity;
        }, 0);

        cart.tongTienChuaGiam = tongTienChuaGiam;
        cart.soTienCanThanhToan = tongTienChuaGiam - cart.soTienGiamGia;

        await cart.save();

        res.status(200).json({ message: 'Đã thêm vào giỏ hàng.', data: cart });
    } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error.message);
        console.error('Chi tiết lỗi:', error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};


const getCartByCustomerId = async (req, res) => {
    try {
        const { cartId } = req.query;

        const cart = await Cart.findOne({ cartId })
            .populate({
                path: 'products._idSP',
                populate: {
                    path: 'IdLoaiSP',
                    model: 'LoaiSP' // tên model bạn export
                }
            });        

        if (!cart) {
            return res.status(404).json({ message: 'Giỏ hàng trống hoặc không tồn tại.' });
        }

        res.status(200).json({ message: 'Lấy giỏ hàng thành công.', data: cart });
    } catch (error) {
        console.error('Lỗi khi lấy giỏ hàng:', error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};

const updateCartItemQuantity = async (req, res) => {
    try {
        const { cartId, _idSP, quantity } = req.body;
        const rawCartId  = typeof cartId === 'string' ? cartId.trim() : String(cartId).trim();

        console.log("Đã làm sạch cartId:", rawCartId);
        console.log("_idSP:", _idSP);
        console.log("quantity:", quantity);

        const cart = await Cart.findOne({ cartId: { $eq: rawCartId } });

        if (!cart) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });

        const index = cart.products.findIndex(p =>
            p._idSP.toString() === _idSP
        );

        if (index === -1) return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });

        cart.products[index].quantity = quantity;

        // Cập nhật lại tổng tiền
        const tongTienChuaGiam = cart.products.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cart.tongTienChuaGiam = tongTienChuaGiam;
        // cart.soTienCanThanhToan = tongTienChuaGiam - cart.soTienGiamGia;

        // Reset giảm giá nếu có
        if (cart.voucherCode) {
            cart.soTienGiamGia = 0;
            cart.soTienCanThanhToan = tongTienChuaGiam;
            cart.voucherCode = null;
        } else {
            cart.soTienCanThanhToan = tongTienChuaGiam - cart.soTienGiamGia;
        }


        await cart.save();

        const populatedCart = await Cart.findOne({ cartId })
        .populate({
            path: 'products._idSP',
            populate: [
              { path: 'IdLoaiSP', model: 'LoaiSP' },
              { path: 'IdHangSX', model: 'HangSX' }
            ]
        });

        res.status(200).json(populatedCart);
    } catch (err) {
        console.error('Lỗi cập nhật giỏ hàng:', err);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};


const removeFromCart = async (req, res) => {
    try {
        const { cartId, _idSP } = req.body;

        const cart = await Cart.findOne({ cartId: cartId });
        if (!cart) return res.status(404).json({ message: "Không tìm thấy giỏ hàng." });

        // Xoá sản phẩm khỏi giỏ hàng
        cart.products = cart.products.filter(item =>
            !(item._idSP.toString() === _idSP)
        );

        // ✅ Cập nhật tổng tiền giỏ hàng sau khi xoá
        const tongTienChuaGiam = cart.products.reduce((total, item) => {
            return total + item.price * item.quantity;
        }, 0);

        cart.tongTienChuaGiam = tongTienChuaGiam;
        // cart.soTienCanThanhToan = tongTienChuaGiam - cart.soTienGiamGia;

        // Reset giảm giá nếu có
        if (cart.voucherCode) {
            cart.soTienGiamGia = 0;
            cart.soTienCanThanhToan = tongTienChuaGiam;
            cart.voucherCode = null;
        } else {
            cart.soTienCanThanhToan = tongTienChuaGiam - cart.soTienGiamGia;
        }

        await cart.save();

        res.status(200).json({ message: "Đã xóa sản phẩm khỏi giỏ hàng.", data: cart });
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        res.status(500).json({ message: "Lỗi server." });
    }
};

const applyVoucherToCart = async (req, res) => {
    try {
        const { voucherCode, cartId } = req.body;

        const cart = await Cart.findOne({ cartId: cartId });
        if (!cart) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });

        // Đã áp dụng mã rồi
        if (cart.voucherCode) {
            return res.status(400).json({ message: 'Bạn đã áp dụng mã giảm giá rồi không thể áp dụng lại!' });
        }

        const voucher = await Voucher.findOne({ code: voucherCode });
        if (!voucher) return res.status(404).json({ message: 'Mã giảm giá không hợp lệ' });

        const dieuKien = parseFloat(voucher.dieuKien);
        const giamGia = parseFloat(voucher.giamGia);

        if (cart.tongTienChuaGiam < dieuKien) {
            return res.status(400).json({ message: `Đơn hàng phải từ ${dieuKien.toLocaleString()} đ để áp dụng mã` });
        }

        const soTienGiamGia = cart.tongTienChuaGiam * (giamGia / 100);
        const soTienCanThanhToan = cart.tongTienChuaGiam - soTienGiamGia;

        cart.soTienGiamGia = soTienGiamGia;
        cart.soTienCanThanhToan = soTienCanThanhToan;
        cart.voucherCode = voucherCode;
        await cart.save();

        res.status(200).json({
            message: 'Áp dụng mã giảm giá thành công',
            data: cart
        });

    } catch (error) {
        console.error('Lỗi khi áp dụng mã:', error);
        res.status(500).json({ message: 'Đã xảy ra lỗi' });
    }
};


module.exports = { addToCart, getCartByCustomerId, removeFromCart, updateCartItemQuantity, applyVoucherToCart };
