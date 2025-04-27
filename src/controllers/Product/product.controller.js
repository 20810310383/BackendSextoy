const SanPham = require('../../model/SanPham');
const path = require('path');
const xlsx = require('xlsx');
const fs = require('fs');
const LoaiSP = require('../../model/LoaiSP');
const HangSX = require('../../model/HangSX');
const { log } = require('console');
require('dotenv').config();

module.exports = {

    getProducts: async (req, res) => {
        try {
            const { page, limit, TenSP, sort, order, 
                locTheoLoai, locTheoGia, locTheoHangSX, IdLoaiSP,
                SoLuotDanhGia, SoLuotBan, GiamGiaSP, tu, den } = req.query; 

            // Chuyển đổi thành số
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);

            // Tính toán số bản ghi bỏ qua
            const skip = (pageNumber - 1) * limitNumber;

            // Tạo query tìm kiếm
            const query = {};
            if (TenSP) {
                const searchKeywords = TenSP.trim().split(/\s+/).map(keyword => {
                    // Chuyển keyword thành regex để tìm kiếm gần đúng (không phân biệt chữ hoa chữ thường)
                    const normalizedKeyword = keyword.toLowerCase();  // Chuyển tất cả về chữ thường để không phân biệt
                    return {
                        TenSP: { $regex: normalizedKeyword, $options: 'i' } // 'i' giúp tìm kiếm không phân biệt chữ hoa chữ thường
                    };
                });
            

                query.$or = searchKeywords;
            }
            // Tìm kiếm theo IdLoaiSP nếu có
            if (locTheoLoai) {
                // Chuyển 'locTheoLoai' từ string sang mảng ObjectId
                const locTheoLoaiArray = Array.isArray(locTheoLoai) ? locTheoLoai : JSON.parse(locTheoLoai);

                query.IdLoaiSP = { $in: locTheoLoaiArray }; // Dùng toán tử $in để lọc theo mảng các ObjectId
            }
            if (IdLoaiSP) {               
                query.IdLoaiSP = IdLoaiSP
            }

            // Tìm kiếm theo IdHangSX nếu có
            if (locTheoHangSX) {
                // Chuyển 'locTheoHangSX' từ string sang mảng ObjectId
                const locTheoHangSXArray = Array.isArray(locTheoHangSX) ? locTheoHangSX : JSON.parse(locTheoHangSX);

                query.IdHangSX = { $in: locTheoHangSXArray }; // Dùng toán tử $in để lọc theo mảng các ObjectId
            }

            // tang/giam
            let sortOrder = 1; // tang dn
            if (order === 'desc') {
                sortOrder = -1; 
            }


            // lọc sản phẩm theo giá từ X đến Y
            if (locTheoGia) {
                let convert_string = locTheoGia.replace(/[^\d-]/g, '');
                let valuesArray = convert_string.split('-');
                let giatri1 = parseFloat(valuesArray[0]);
                let giatri2 = parseFloat(valuesArray[1]);
            
                // Lọc sản phẩm có giá trong sizes[0].price nằm trong khoảng giatri1 và giatri2
                if (convert_string) {
                    query.sizes = { $gte: giatri1, $lte: giatri2 }
                }
            }
           
            // if(tu && den) {
            //     let giatri3 = parseFloat(tu);
            //     let giatri4 = parseFloat(den);
            //     console.log("giatri3: ", giatri3);
            //     console.log("giatri4: ", giatri4);
            //     // Lọc sản phẩm có giá trong sizes[0].price nằm trong khoảng giatri1 và giatri2
            //     if (giatri3 && giatri4) {
            //         query.sizes = {
            //             $elemMatch: {
            //                 price: { $gte: giatri3, $lte: giatri4 }
            //             }
            //         };
            //     }
            // }   
            
            if (SoLuotDanhGia) {
                query.SoLuotDanhGia = { $gt: SoLuotDanhGia };  // Lọc sản phẩm có số lượng đánh giá lớn hơn 10
            }

            if (SoLuotBan) {
                query.SoLuongBan = { $gt: SoLuotBan };  // Lọc sản phẩm có số lượng bán lớn hơn 10
            }

            if (GiamGiaSP) {
                query.GiamGiaSP = { $gt: GiamGiaSP };  // Lọc sản phẩm có GiamGiaSP lớn hơn 20
            }
            
            let sp = await SanPham.find(query)
                .populate("IdHangSX IdLoaiSP")
                .skip(skip)
                .limit(limitNumber)
                .sort({ [sort]: sortOrder })

            // Sắp xếp mảng sizes theo price từ thấp đến cao
            sp = sp.map(product => {
                // Sort sizes array based on price (ascending)
                if (product.sizes && product.sizes.length > 0) {
                    product.sizes.sort((a, b) => a.price - b.price); // Sort sizes array by price
                }
                return product;
            });

            const totalSanPham = await SanPham.countDocuments(query); // Đếm tổng số chức vụ

            const totalPages = Math.ceil(totalSanPham / limitNumber); // Tính số trang

            if(sp) {
                return res.status(200).json({
                    message: "Đã tìm ra products",
                    errCode: 0,
                    data: sp,
                    totalSanPham,
                    totalPages,
                    currentPage: pageNumber,
                })
            } else {
                return res.status(500).json({
                    message: "Tìm products thất bại!",
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

    createProduct: async (req, res) => {
        try {
            let {TenSP, GiamGiaSP, MoTa, MoTaChiTiet, ImageSlider, Image, IdHangSX, IdLoaiSP, sizes, urlYoutube, MoTaMotChut} = req.body                             

            let createSP = await SanPham.create({TenSP, GiamGiaSP, MoTa, MoTaChiTiet, ImageSlider, Image, IdHangSX, IdLoaiSP, sizes, urlYoutube, MoTaMotChut})

            if(createSP){
                return res.status(200).json({
                    message: "Bạn đã thêm sản phẩm thành công!",
                    errCode: 0,
                    data: createSP
                })
            } else {
                return res.status(500).json({
                    message: "Bạn thêm sản phẩm thất bại!",                
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

    updateProduct: async (req, res) => {
        try {
            let {_id, TenSP, IdHangSX, IdLoaiSP, sizes, Image, ImageSlider, MoTa, MoTaChiTiet, GiamGiaSP, urlYoutube, MoTaMotChut} = req.body

            let updateTL = await SanPham.updateOne({_id: _id},{TenSP, IdHangSX, IdLoaiSP, sizes, Image, ImageSlider, MoTa, MoTaChiTiet, GiamGiaSP, urlYoutube, MoTaMotChut})

            if(updateTL) {
                return res.status(200).json({
                    data: updateTL,
                    message: "Chỉnh sửa sản phẩm thành công"
                })
            } else {
                return res.status(404).json({                
                    message: "Chỉnh sửa sản phẩm thất bại"
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

    deleteProduct: async (req, res) => {
        try {
            const _id = req.params.id
            let xoaTL = await SanPham.deleteOne({_id: _id})

            if(xoaTL) {
                return res.status(200).json({
                    data: xoaTL,
                    message: "Bạn đã xoá sản phẩm thành công!"
                })
            } else {
                return res.status(500).json({
                    message: "Bạn đã xoá sản phẩm thất bại!"
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

    // Xử lý file Excel và lưu sản phẩm vào MongoDB
    importProductsFromExcel: async (req, res) => {
        // Lấy tên file gốc từ frontend
        const originalFileName = req.body.originalFileName;  // Tên file gốc từ frontend
        console.log('Original file name:', originalFileName);

        console.log('Uploaded file:', req.file);
        const filePath = path.join(__dirname, '../../public/excel/', originalFileName);
        console.log("filePath: ",filePath);        
        try {
            const workbook = xlsx.readFile(filePath); // Đọc file Excel
            const sheetName = workbook.SheetNames[0]; // Lấy sheet đầu tiên
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet); // Chuyển dữ liệu sheet thành JSON
            console.log("data: ",data);
            
            const products = [];
            for (let i = 0; i < data.length; i++) {
                const product = data[i];
                
                // Kiểm tra thể loại sản phẩm
                console.log("product: ",product);                
                const category = await LoaiSP.findOne({ TenLoaiSP: product.IdLoaiSP });
                if (!category) {
                    return res.status(400).json({ message: `Thể loại không hợp lệ: ${product.IdLoaiSP}` });
                }
    
                // Kiểm tra hãng sản xuất
                const brand = await HangSX.findOne({ TenHangSX: product.IdHangSX });
                if (!brand) {
                    return res.status(400).json({ message: `Hãng sản xuất không hợp lệ: ${product.IdHangSX}` });
                }

                // Chuyển các thông tin size, quantity, price thành mảng                
                const sizes = product.size ? product.size.replace(/,\s*$/, '').split(',').map(size => size.trim()) : []; // Tách các size
                const quantities = product.quantity ? String(product.quantity).replace(/,\s*$/, '').split(',').map(quantity => parseInt(quantity.trim())) : []; // Chuyển quantity thành chuỗi và tách
                const prices = product.price ? String(product.price)
                    .replace(/,\s*$/, '')  // Loại bỏ dấu phẩy thừa cuối chuỗi (nếu có)
                    .split(',')  // Tách chuỗi theo dấu phẩy
                    .map(price => parseFloat(price.trim()))  // Chuyển đổi từng giá trị thành float
                : []; // Chuyển price thành chuỗi và tách

                console.log("product.size:", product.size);
                console.log("product.quantity:", product.quantity);
                console.log("product.price:", product.price);

                // Kiểm tra rằng số lượng các phần tử là khớp nhau
                // if (sizes.length !== quantities.length || sizes.length !== prices.length) {
                //     return res.status(400).json({ message: 'Dữ liệu size, quantity, price không hợp lệ, số lượng không khớp.' });
                // }

                // Tính tổng số lượng tồn kho từ tất cả các quantity
                const totalQuantity = quantities.reduce((acc, quantity) => acc + quantity, 0);

                // Tạo sản phẩm
                const newProduct = new SanPham({
                    TenSP: product.TenSP,
                    // GiaBan: product.GiaBan,
                    GiamGiaSP: product.GiamGiaSP || 0,
                    MoTa: product.MoTa || 'Không có mô tả',
                    MoTaChiTiet: product.MoTaChiTiet || 'Không có mô tả chi tiết',
                    IdHangSX: brand._id,
                    IdLoaiSP: category._id,
                    sizes: sizes.map((size, index) => ({
                        size: size,
                        quantity: quantities[index],
                        price: prices[index]
                    })),
                    SoLuongTon: totalQuantity  
                });
    
                products.push(newProduct); // Thêm sản phẩm vào mảng
            }
            console.log("products: ",products);      
    
            // Lưu tất cả sản phẩm vào MongoDB
            await SanPham.insertMany(products);   
            
            // Xóa file Excel sau khi xử lý xong
            fs.unlinkSync(filePath); // Xóa file Excel tạm sau khi import
    
            res.status(200).json({ message: 'Import sản phẩm thành công', data: products });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Có lỗi xảy ra khi import sản phẩm', error: error.message });
        }
    },

    getProductToCategoryNoiBat: async (req, res) => {
        try {
            const { page, limit, TenSP, sort, order, 
                locTheoLoai, locTheoGia, locTheoHangSX,
                SoLuotDanhGia, SoLuotBan, GiamGiaSP, tu, den, IdLoaiSP } = req.query; 
            console.log("id: ", IdLoaiSP);

            // Chuyển đổi thành số
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);

            // Tính toán số bản ghi bỏ qua
            const skip = (pageNumber - 1) * limitNumber;
            
            if (!IdLoaiSP) {
                return res.status(400).json({ message: "IdLoaiSP is required!" });
            }

            // Nếu IdLoaiSP là một chuỗi, ta sẽ chuyển nó thành mảng
            const idLoaiSPArray = IdLoaiSP.split(','); // Tách chuỗi thành mảng nếu cần

            let sp = await SanPham.find({ 
                IdLoaiSP: { $in: idLoaiSPArray },
                SoLuongBan: { $gt: 2 }  // Tìm các sản phẩm có SoLuongBan lớn hơn 2
            }).populate("IdHangSX IdLoaiSP")

            if(sp && sp.length > 0) {
                return res.status(200).json({
                    data: sp,
                    message: "Bạn đã tìm sản phẩm nổi bật thành công!"
                })
            } else {
                return res.status(500).json({
                    message: "Bạn đã tìm sản phẩm thất bại!"
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

    getDetailSP: async (req, res) => {
        try {
            const {id} = req.query
            console.log("id getDetailSP: ", id);            

            let sp = await SanPham.findById(id).populate("IdHangSX IdLoaiSP")
            if(sp) {
                return res.status(200).json({
                    data: sp,
                    message: "Đã có thông tin chi tiết!"
                })
            } else {
                return res.status(500).json({
                    message: "Thông tin chi tiết thất bại!"
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

    getProductToCategorySPLienQuan: async (req, res) => {
        try {
            const { page, limit, TenSP, sort, order, 
                locTheoLoai, locTheoGia, locTheoHangSX,
                SoLuotDanhGia, SoLuotBan, GiamGiaSP, tu, den, IdLoaiSP,  } = req.query; 
            console.log("id: ", IdLoaiSP);

            // Chuyển đổi thành số
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);

            // Tính toán số bản ghi bỏ qua
            const skip = (pageNumber - 1) * limitNumber;
            console.log("id getProductToCategorySPLienQuan: ", IdLoaiSP);
            
            if (!IdLoaiSP) {
                return res.status(400).json({ message: "IdLoaiSP is required!" });
            }

            // Nếu IdLoaiSP là một chuỗi, ta sẽ chuyển nó thành mảng
            const idLoaiSPArray = IdLoaiSP.split(','); // Tách chuỗi thành mảng nếu cần

            // ----------------------
            // Tạo query tìm kiếm
            const query = {};
            if (TenSP) {
                const searchKeywords = (TenSP || '')
                const keywordsArray = searchKeywords.trim().split(/\s+/);

                const searchConditions = keywordsArray.map(keyword => ({
                    TenSP: { $regex: keyword, $options: 'i' } // Tìm kiếm không phân biệt chữ hoa chữ thường
                }));

                query.$or = searchConditions;
            }

            // Tìm kiếm theo IdHangSX nếu có
            if (locTheoHangSX) {
                // Chuyển 'locTheoHangSX' từ string sang mảng ObjectId
                const locTheoHangSXArray = Array.isArray(locTheoHangSX) ? locTheoHangSX : JSON.parse(locTheoHangSX);

                query.IdHangSX = { $in: locTheoHangSXArray }; // Dùng toán tử $in để lọc theo mảng các ObjectId
            }

            // tang/giam
            let sortOrder = 1; // tang dn
            if (order === 'desc') {
                sortOrder = -1; 
            }

            // lọc sản phẩm theo giá từ X đến Y
            if (locTheoGia) {
                let convert_string = locTheoGia.replace(/[^\d-]/g, '');
                let valuesArray = convert_string.split('-');
                let giatri1 = parseFloat(valuesArray[0]);
                let giatri2 = parseFloat(valuesArray[1]);
            
                // Lọc sản phẩm có giá trong sizes[0].price nằm trong khoảng giatri1 và giatri2
                if (convert_string) {
                    query.sizes = {
                        $elemMatch: {
                            price: { $gte: giatri1, $lte: giatri2 }
                        }
                    };
                }
            }
           
            if(tu && den) {
                let giatri3 = parseFloat(tu);
                let giatri4 = parseFloat(den);
                console.log("giatri3: ", giatri3);
                console.log("giatri4: ", giatri4);
                // Lọc sản phẩm có giá trong sizes[0].price nằm trong khoảng giatri1 và giatri2
                if (giatri3 && giatri4) {
                    query.sizes = {
                        $elemMatch: {
                            price: { $gte: giatri3, $lte: giatri4 }
                        }
                    };
                }
            }   
            
            if (SoLuotDanhGia) {
                query.SoLuotDanhGia = { $gt: SoLuotDanhGia };  // Lọc sản phẩm có số lượng đánh giá lớn hơn 10
            }

            if (SoLuotBan) {
                query.SoLuongBan = { $gt: SoLuotBan };  // Lọc sản phẩm có số lượng bán lớn hơn 10
            }

            if (GiamGiaSP) {
                query.GiamGiaSP = { $gt: GiamGiaSP };  // Lọc sản phẩm có GiamGiaSP lớn hơn 20
            }

            // Thêm điều kiện lọc theo loại sản phẩm (IdLoaiSP)
            query.IdLoaiSP = { $in: idLoaiSPArray };
            
            let sp = await SanPham.find(query)
                .collation({ locale: 'vi', strength: 1 }) 
                .populate("IdHangSX IdLoaiSP")
                .skip(skip)
                .limit(limitNumber)
                .sort({ [sort]: sortOrder })

            // Sắp xếp mảng sizes theo price từ thấp đến cao
            sp = sp.map(product => {
                // Sort sizes array based on price (ascending)
                if (product.sizes && product.sizes.length > 0) {
                    product.sizes.sort((a, b) => a.price - b.price); // Sort sizes array by price
                }
                return product;
            });

            const totalSanPham = await SanPham.countDocuments(query); // Đếm tổng số chức vụ

            const totalPages = Math.ceil(totalSanPham / limitNumber); // Tính số trang

            if(sp) {
                return res.status(200).json({
                    message: "Đã tìm ra products",
                    errCode: 0,
                    data: sp,
                    totalSanPham,
                    totalPages,
                    currentPage: pageNumber,
                })
            } else {
                return res.status(500).json({
                    message: "Tìm products thất bại!",
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

    deleteNhieuProduct: async (req, res) => {
        // const { ids } = req.body; // ids là mảng chứa các _id của các sản phẩm cần xóa
        const ids = req.query.ids ? req.query.ids.split(',') : []; // Lấy mảng ids từ query string
        console.log("ids: ", ids);
        
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Vui lòng cung cấp mảng _id hợp lệ' });
        }

        try {
            // Xóa các sản phẩm với các _id trong mảng ids
            const result = await SanPham.deleteMany({ _id: { $in: ids } });

            if (result.deletedCount === 0) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm nào để xóa' });
            }

            res.status(200).json({ message: `${result.deletedCount} sản phẩm đã được xóa thành công` });
        } catch (error) {
            console.error('Error deleting products:', error);
            res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa sản phẩm' });
        }
    },

    timSPCanCheckSoLuongTon: async (req, res) => {
        try {
            const { dataDetailSP, quantity, customerId, selectedSize } = req.query;
    
            log("dataDetailSP: ", dataDetailSP);
            // Tìm sản phẩm trong cơ sở dữ liệu dựa vào product ID
            const product = await SanPham.findOne({ _id: dataDetailSP });
    
            // Nếu không tìm thấy sản phẩm, trả về lỗi
            if (!product) {
                return res.status(404).json({ message: 'Sản phẩm không tồn tại', status: 404, });
            }
    
            // Tìm size sản phẩm trong mảng sizesSchema
            const selectedProductSize = product.sizes.find(size => size.size === selectedSize);
    
            // Nếu không tìm thấy kích thước sản phẩm, trả về lỗi
            if (!selectedProductSize) {
                return res.status(400).json({ message: `Kích thước ${selectedSize} không có trong sản phẩm này`, status: 400, });
            }
    
            // Kiểm tra số lượng sản phẩm trong size đã chọn
            if (selectedProductSize.quantity < quantity) {
                return res.status(400).json({
                    message: `Sản phẩm: ${product.TenSP} - Cấu hình: ${selectedSize} ⚠ không đủ số lượng trong kho. Sản phẩm này còn ${selectedProductSize.quantity} sản phẩm. Bạn không thể thêm sản phẩm này vào giỏ hàng!`, status: 400,                   
                });
            }

            // Nếu đủ số lượng, trả về thành công
            return res.status(200).json({status: 200, message: "Số lượng đủ, có thể thêm vào giỏ hàng" });
                
        } catch (error) {
            console.error('Lỗi khi thêm sản phẩm vào giỏ:', error);
            return res.status(500).json({ message: 'Đã xảy ra lỗi, vui lòng thử lại!' });
        }
    }
}