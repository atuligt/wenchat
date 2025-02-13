const User = require('../Models/User.model')
const bcrypt = require('../Utils/Bcrypt')
const jwt=require('../Utils/JsonWebToken')

const RegisterUser = async (req, res) => {
    try {
        const { name, email, password } = req.body
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please fill all the fields" })
        }
        const isEmailExists = await User.findOne({ email })
        if (isEmailExists) {
            return res.status(400).json({ message: "User already exists" })
        } else {
            const userData = {
                name,
                email: email.toLowerCase(),
                password: await bcrypt.hashPassword(password)
            }
            const user =  new User(userData)
            await user.save()
            const userId=user._id
            const useEmail=user.email
            const token=await jwt.token(userId,useEmail)
            res.status(200).json({ message: "User registered successfully", user,token })
        }
      
    } catch (error) {
        console.log(error, "error in register user controller")
    }
}

const LoginUser=async(req,res)=>{
    try{
        const {email,password}=req.body
        if(!email || !password){
            return res.status(400).json({message:"Please fill all the fields"})
        }
        const em= email.toLowerCase()
        const user=await User.findOne({email:em})
        if(!user){
            return res.status(400).json({message:"User not found"})
        }
        const isMatch=await bcrypt.comparePassword(password,user.password)
        if(!isMatch){
            return res.status(400).json({message:"Invalid credentials"})
        }
        const userId=user._id
        const useEmail=user.email
        const token=await jwt.token(userId,useEmail)
        res.status(200).json({message:"User logged in successfully",user,token})

    }catch(error){
        console.log(error, "error in login user controller")
    }
}

module.exports = { RegisterUser,LoginUser }