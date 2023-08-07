const Sequelize = require('sequelize');
const sequelize = require('../util/database')

const DownloadUrl = sequelize.define('downloadUrl', {
    id: {
        type: Sequelize.INTEGER,
        unique:true,
        autoIncrement:true,
        allowNull: false,
        primaryKey:true
    },
    filename: {
        type:Sequelize.STRING,
        allowNull:false,
    },
    fileURL: {
        type:Sequelize.STRING,
        allowNull:false,
    },
})

module.exports = DownloadUrl