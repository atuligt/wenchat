const jwt = require('jsonwebtoken')

const token = async (userId, userEmail) => {
    try {
        const token = jwt.sign({ userId, userEmail }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' })
        return token;
    } catch (error) {
        console.log(error)
    }
}

const verifyToken = async (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        return decoded
    } catch (error) {
        console.log(error)
    }

}

module.exports = { token, verifyToken }