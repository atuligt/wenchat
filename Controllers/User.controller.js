const UserServer = require('../Server/User.server')

const RegisterUser = async (req, res) => {
    try {
        const result = await UserServer.RegisterUser(req, res)
        return result;

    } catch (error) {
        console.log(error, "error in register user controller")
    }
}

const LoginUser = async (req, res) => {
    try {
        const result = await UserServer.LoginUser(req, res)
        return result;

    } catch (error) {
        console.log(error, "error in login user controller")
    }
}

module.exports = { RegisterUser,LoginUser }