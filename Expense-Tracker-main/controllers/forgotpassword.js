const Forgotpassword = require('../models/forgotpassword');
const User = require('../models/User');
const uuid = require('uuid');
const Sib = require('sib-api-v3-sdk');
require('dotenv').config();
const sequelize = require('../util/database');
const bcrypt = require('bcrypt');

exports.postForgotPassword = async (req,res,next) => {
    const sequelizeTransaction = await sequelize.transaction(); 
    try {
        const {email} = req.body;
        const userFound = await User.findOne({where: {email:email},transaction: sequelizeTransaction});
        
        if(userFound){
            const id = uuid.v4();
            await userFound.createForgotpassword({ id , active: true },{transaction: sequelizeTransaction})
                .catch(err => {
                    console.log(err);
                    throw new Error(err)
                });

            const client = Sib.ApiClient.instance;
            const apiKey = client.authentications['api-key']
            apiKey.apiKey = process.env.SENDINBLUE_API_KEY;
            const tranEmailApi = new Sib.TransactionalEmailsApi();

            const sender = {
                email: 'ganeshsai29101@gmail.com',
                name: 'Sai Ganesh'
            }

            const receivers = [
                {
                email: email
                }
            ]

            await tranEmailApi.sendTransacEmail({
                sender,
                to: receivers,
                subject: 'Reset Password',
                textContent: `Reset Password`,
                htmlContent: `<a href="http://localhost:3000/password/resetpassword/${id}">Reset password</a>`
            })
            .then(res=>console.log(res))
            .catch(err=>{
                console.log(err);
                throw new Error(err);
            });
            await sequelizeTransaction.commit();
            return res.status(201).json({success: true,message: 'Reset Mail Sent Successful'});
        } else {
            throw Error('User does not exist');
        }
    } catch(error) {
        console.log(error);
        await sequelizeTransaction.rollback();
        res.status(404).json({success:false, error:error.message});
    }
}

exports.getResetPassword = async (req,res,next) => {
    const id = req.params.id;
    const sequelizeTransaction = await sequelize.transaction(); 
    try {
    const forgotUser = await Forgotpassword.findOne({where: {id},transaction: sequelizeTransaction});
    if(forgotUser) {
        if(forgotUser.dataValues.active) {
            res.status(201).send(`
            <html>                       
                <form action="/password/updatepassword/${id}" method="get">
                    <label for="newPassword">Enter New password</label>
                    <input name="newPassword" type="password" id="newPassword" required></input>
                    <button id='reset-btn'> Reset Password </button>
                </form>
            </html>
            `);
            await sequelizeTransaction.commit();
            res.end();
        } else {
            await sequelizeTransaction.rollback();
            return res.status(404).json({success: false, error: 'Link expired'});
        }
    } else {
        throw new Error('Wrong reset password link');
    }
    } catch(error) {
        await sequelizeTransaction.rollback();
        return res.status(404).json({success:false, error:error.message});
    }
}

exports.getUpdatePassword = async (req,res,next) => {
    const id = req.params.id;
    const newPassword = req.query.newPassword;
    const sequelizeTransaction = await sequelize.transaction(); 
    try {
        const forgotUser = await Forgotpassword.findOne({where: {id},transaction: sequelizeTransaction});
        forgotUser.update({ active: false},{transaction: sequelizeTransaction});

        bcrypt.hash(newPassword, 10, async (err, hash) => {
            if(err) console.log(err);
            await User.update({password: hash }, {where: {id: forgotUser.userId},transaction: sequelizeTransaction});
            await sequelizeTransaction.commit();
            res.status(201).json({ message: 'Succcessfully updated user password' });
        });

    } catch (err) {
        console.log(err);
        await sequelizeTransaction.rollback();
        res.status(500).json({ error: err });
    }
}