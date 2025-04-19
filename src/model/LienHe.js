const mongoose = require('mongoose');

const LienHe_Schema = new mongoose.Schema({   
        text: { type: String, default: '' },                        
    },
    { 
        timestamps: true,   // createAt, updateAt
    }
);

module.exports = mongoose.model("LienHe", LienHe_Schema);