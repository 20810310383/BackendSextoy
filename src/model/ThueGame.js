const mongoose = require('mongoose');

const ThueGame_Schema = new mongoose.Schema({   
        text: { type: String, default: '' },                        
    },
    { 
        timestamps: true,   // createAt, updateAt
    }
);

module.exports = mongoose.model("ThueGame", ThueGame_Schema);