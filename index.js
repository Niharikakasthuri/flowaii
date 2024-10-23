const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const app = express()
const Transactions = require('./model')
const dburl = 'mongodb+srv://kasthuriniharika32:flowaii@cluster2.qeuyz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster2'
app.use(bodyParser.json())

app.get('/',(req,res) => {
    res.send("Hello")
})

mongoose.connect(dburl,{})
.then(() => {
    app.listen(3000,() => {
        console.log("MongoDB Connected")
    })
})
.catch((error) => {
    console.log("Unable to connect to MongoDB")
})


app.post('/transactions',async(req,res) => {
    const {type,category,amount,date,description} = req.body 
    if(!type || !['income','expense'].includes(type)){
        return res.status(400).json({error:"Inavlid transaction type"})
    }
    if(!amount || typeof amount !== 'number'){
        return res.status(400).json({error:"Amount must be number"})
    }
    if(!category){
        return res.status(400).json({error:"Category is required"})
    }
    try{
        const transaction = new Transactions({
            type,
            category,
            amount,
            date,
            description
        })
        const savedTransactions = await transaction.save()
        res.status(201).json(savedTransactions)
    }catch(error){
        console.log("Error:",error)
        res.status(500).json({error:"Internal error"})
    }
})

app.get('/transactions',async(req,res) => {
    const page = parseInt(req.query.page) || 1 
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    try{
        const allData = await Transactions.find()
        .skip(skip)
        .limit(limit)
        .sort({date: -1})
        const totalTransactions = await Transactions.countDocuments()
        const totalPages = Math.ceil(totalTransactions/limit)
        return res.json({currentPage:page,totalPages:totalPages,transactions:allData})
    }catch(error){
        console.log(error.message)
        return res.status(500).json({error:"Internal error"})
    }
})

app.get('/transactions/:id',async(req,res) => {
    try{
        const idData = await Transactions.findById(req.params.id)
        if (!idData){
            return res.status(404).json({message:"Transaction not found"})
        }
        return res.json(idData)
    }catch(error){
        console.log(error.message)
        return res.status(500).json({error:"Internal error"})
    }
})

app.put('/transactions/:id',async(req,res) => {
    try{
        const id = req.params.id 
        const updateData = req.body 
        const updatedTransaction = await Transactions.findByIdAndUpdate(id,updateData, {
            new:true,
            runValidators:true
        })
        if(!updatedTransaction){
            return res.status(404).json({message:"Transaction not found"})
        }
        return res.json(updatedTransaction)
    }catch(error){
        console.log(error.message)
        return res.stataus(500).json({error:"Invalid error"})
    }
})

app.delete('/transactions/:id',async(req,res) => {
    try{
        const deletedTransactions = await Transactions.findByIdAndDelete(req.params.id)
        if(!deletedTransactions){
            return res.status(404).json({message:"Transaction not found"})
        }
        return res.json({message:"Transaction deleted successfully",transactions:await Transactions.find()})
    }catch(error){
        console.log(error.message)
        return res.status(500).json({error:"Internal error"})
    }
})

app.get('/summary', async (req, res) => {
    const { startDate, endDate, category } = req.query;
    const query = {};
    if (startDate || endDate) {
        query.date = {};
        if (startDate) {
            query.date.$gte = new Date(startDate); 
        }
        if (endDate) {
            query.date.$lte = new Date(endDate);
        }
    }
    if (category) {
        query.category = category;
    }
    try {
        const transactions = await Transactions.find(query);
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => acc + t.amount, 0);
        
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => acc + t.amount, 0);
        
        const balance = totalIncome - totalExpenses;
        return res.json({
            totalIncome,
            totalExpenses,
            balance,
            totalTransactions: transactions.length,
        });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: "Internal error" });
    }
});
