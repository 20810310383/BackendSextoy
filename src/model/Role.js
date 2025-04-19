const mongoose = require('mongoose');

const Role_Schema = new mongoose.Schema({        
        key: { type: String },        
        name: { type: String },        
    },
    { 
        timestamps: true,   // createAt, updateAt
    }
);
module.exports = mongoose.model("Role", Role_Schema);