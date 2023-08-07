const Expense = require('../models/expense');
const User = require('../models/User');
const sequelize = require('../util/database');
const DownloadUrl = require('../models/downloadUrl');
const UserServices = require('../services/UserServices');
const S3services = require('../services/S3services');

exports.getDownloadExpenses = async (req, res, next) => {
    try {
        const expenses = await UserServices.getExpenses(req);
        const stringifiedExpenses = JSON.stringify(expenses);
        const userId = req.user.id;
        const filename = `${userId}Expense${new Date()}.txt`;
        const fileURL = await S3services.uploadToS3(stringifiedExpenses,filename);

        const downloadUrlData = await req.user.createDownloadUrl({
            fileURL: fileURL,
            filename
        });

        res.status(200).json({fileURL, downloadUrlData, success:true});
    } catch(err) {
        console.log(err);
        res.status(500).json({err,success:false,fileURL:''})
    }
}


exports.getDownloadAllUrl = async(req,res,next) => {
    try {
        let urls = await req.user.getDownloadUrls();
        if(!urls){
            res.sttus(404).json({ message: 'no urls found'})
        }
        res.status(200).json({ urls, success: true})
    } catch (error) {
        res.status(500).json({error})
    }
}

exports.getExpenses = async (req, res, next) => {
    try{
        let page = req.params.pageNo || 1;
        let Items_Per_Page = +req.query.perpage;
        const totalItems = await Expense.count({where: {userId: req.user.id}});
        const data = await req.user.getExpenses({offset: (page-1)*Items_Per_Page,limit: Items_Per_Page})

        res.status(200).json({
            data,
            info: {
                currentPage: page,
                hasNextPage: totalItems > page * Items_Per_Page,
                hasPreviousPage: page > 1,
                nextPage: +page + 1,
                previousPage: +page - 1,
                lastPage: Math.ceil(totalItems / Items_Per_Page) 
            }
        });
    }catch(err) {
       console.log(err);
       res.status(500).json({err});
    }
}

exports.postExpense = async (req, res, next) => {
    const sequelizeTransaction = await sequelize.transaction(); 
    try{
        const amount = req.body.amount;
        const description = req.body.description;
        const category = req.body.category;
        const data = await Expense.create({
            amount: amount,
            description:description,
            category:category,
            userId: req.user.id},
            {transaction: sequelizeTransaction}
        );

        const tExpense = +req.user.totalExpense + +amount;
        await User.update(
            { totalExpense: tExpense},
            {where: {id:req.user.id},
            transaction: sequelizeTransaction}
        )
        
        await sequelizeTransaction.commit();
        res.status(201).json( data);
    } catch (err) {
        await sequelizeTransaction.rollback();
        res.status(500).json({error:err})
    } 
}

exports.deleteExpense = async (req, res, next) => {
    const sequelizeTransaction = await sequelize.transaction();
    try{
        const expenseId = req.params.expenseId;
        const expenseField = await Expense.findByPk(expenseId, {where: { userId: req.user.id},transaction: sequelizeTransaction})
        await expenseField.destroy({transaction: sequelizeTransaction});
        
        const userTExpense = await User.findByPk(req.user.id,{
            attributes: ['totalExpense'],
            raw: true,
            transaction: sequelizeTransaction
        });
        
        const editedTotal = userTExpense.totalExpense - expenseField.dataValues.amount;
        await User.update({totalExpense: editedTotal},{where: {id:req.user.id}, transaction:sequelizeTransaction})

        await sequelizeTransaction.commit();
        res.status(201).json({delete: expenseField});
    } catch(err) {
        await sequelizeTransaction.rollback();
        console.error(err);
    }
}

exports.editExpense = async (req,res,next)=>{
    const sequelizeTransaction = await sequelize.transaction();
    try{
        const expenseId = req.params.expenseId;
        const amount = req.body.amount;
        const description = req.body.description;
        const category = req.body.category;

        const befExpense = await Expense.findByPk(expenseId,{
            attributes: ['amount'],
            raw: true,
            transaction: sequelizeTransaction
        });

        const chUser = await User.findByPk(req.user.dataValues.id,{
            attributes: ['totalExpense'],
            raw: true,
            transaction: sequelizeTransaction
        });

        const updatedExpense = +chUser.totalExpense - +befExpense.amount + +amount;
        const updatedUser = await User.update({
            totalExpense: updatedExpense
        },{where: {id:req.user.dataValues.id}, transaction: sequelizeTransaction})

        const data = await Expense.update({
            amount: amount,
            description:description,
            category:category
        },{where: {id:expenseId}, transaction: sequelizeTransaction});

        sequelizeTransaction.commit();
        res.status(201).json( data);
    } catch (err) {
        sequelizeTransaction.rollback();
        res.status(500).json({error:err})
    } 
}