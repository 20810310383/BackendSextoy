const Comments = require('../../model/Comments');

require('dotenv').config();

module.exports = {

    createComment: async (req, res) => {
        try {
            let {title, soSaoDanhGia, idKH, idSP} = req.body

            let create = await Comments.create({title, soSaoDanhGia, idKH, idSP})

            if(create){
                return res.status(200).json({
                    message: "Bình luận thành công!",
                    errCode: 0,
                    data: create
                })
            } else {
                return res.status(500).json({
                    message: "Bình luận thành công thất bại!",                
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

    getComment: async (req, res) => {
        try {

            const { page, limit, idSP } = req.query; 
    
            // Chuyển đổi thành số
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);
    
            // Tính toán số bản ghi bỏ qua
            const skip = (pageNumber - 1) * limitNumber;

            let findCommentLength = await Comments.find({ idSP: idSP })
            .populate("idKH idSP");

            let findComment = await Comments.find({ idSP: idSP })
            .skip(skip)
            .limit(limitNumber)
            .populate("idKH idSP");
            console.log("find: ", findComment);                        

            // Lọc ra các phần tử có 'soSaoDanhGia' = 1, 2, 3, 4, 5 và đếm số lượng
            let starCount = {
                1: findCommentLength.filter(item => item.soSaoDanhGia === "1").length,
                2: findCommentLength.filter(item => item.soSaoDanhGia === "2").length,
                3: findCommentLength.filter(item => item.soSaoDanhGia === "3").length,
                4: findCommentLength.filter(item => item.soSaoDanhGia === "4").length,
                5: findCommentLength.filter(item => item.soSaoDanhGia === "5").length,
            };

            // Tính tổng số bình luận
            let totalComments = await Comments.countDocuments({ idSP: idSP });
                   
            if(findComment){
                return res.status(200).json({
                    message: "Tìm Bình luận thành công!",
                    errCode: 0,
                    data: {
                        comments: findComment,
                        totalComments: totalComments,  // Tổng số bình luận cho sản phẩm này
                        totalPages: Math.ceil(totalComments / limitNumber),  // Tổng số trang
                        currentPage: pageNumber,  // Trang hiện tại
                        starCount: starCount // Trả về số lượng đánh giá theo sao
                    }
                })
            } else {
                return res.status(500).json({
                    message: "Tìm Bình luận thành công thất bại!",                
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

    deleteComment: async (req, res) => {
        try {
            let id = req.params.id
            console.log("id: ",id);
            
            let findComment = await Comments.deleteOne({_id: id})
            console.log("find: ", findComment);
            
            if(findComment){
                return res.status(200).json({
                    message: "Xóa Bình luận thành công!",
                    errCode: 0,
                    data: findComment
                })
            } else {
                return res.status(500).json({
                    message: "Xóa Bình luận thành công thất bại!",                
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
    }
}