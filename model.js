const mongoose = require('mongoose')
const transactionScheme = new mongoose.Schema({
    type:{
        type:String,
        required:true 
    },
    category:[{
        name:{type:String},
        type:{type:String}
    }],
    amount:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        required:true
    },
    description:{
        type:String 
    }
})

const Transactions = mongoose.model("Transactions",transactionScheme)
module.exports = Transactions 