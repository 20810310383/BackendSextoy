const express = require("express");
const { addToCart, getCartByCustomerId, removeFromCart, updateCartItemQuantity, applyVoucherToCart } = require("../controllers/Cart/cart.controller");


const router = express.Router();

// thêm sp vào giỏ hàng
router.post("/add-to-cart", addToCart );
router.get("/get-cart-by-idkh", getCartByCustomerId );

router.post('/remove-item', removeFromCart);
router.post('/apply-voucher', applyVoucherToCart);

router.put('/update-quantity', updateCartItemQuantity);

module.exports = router;