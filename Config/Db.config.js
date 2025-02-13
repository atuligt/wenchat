const mongoose = require('mongoose');
const dotenv = require('dotenv')
dotenv.config()

const DB_URL = process.env.DB_URL


const DbConnect = async () => {
    try {
        console.log(DB_URL)
        await mongoose.connect(DB_URL);
        if (mongoose.connection.readyState === 1) {
            console.log('Database connected');
        } else {
            console.log('Database not connected');
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = DbConnect;



