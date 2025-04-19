const mongoose = require('mongoose');

// Giả sử đây là ObjectId mặc định bạn muốn đặt ===> mặc định là ADMIN
const defaultRoleId = new mongoose.Types.ObjectId("67291039d9b0db6a6b5ca833");

const AccAdmin_Schema = new mongoose.Schema({   
        email: { type: String,  required: true },
        password: { type: String, required: true },
        firstName: { type: String, default: "Tú" },        
        lastName: { type: String, default: "Khắc"  },        
        address: { type: String, default: "Hà Nội" },        
        phone: { type: String },        
        gender: { type: Boolean, default: true},        
        isActive: { type: Boolean, default: true},        
        image: { type: String },  
        tokenAccess: { type: String },  
        roleId: {
            ref: "Role", 
            type: mongoose.SchemaTypes.ObjectId,
            default: defaultRoleId // Đặt giá trị mặc định
        },                                           
    },
    { 
        timestamps: true,   // createAt, updateAt
    }
);
module.exports = mongoose.model("AccAdmin", AccAdmin_Schema);