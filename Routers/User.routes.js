const express=require('express')
const router=express.Router()
const UserController=require('../Controllers/User.controller')

router.post('/register',UserController.RegisterUser)
router.post('/login',UserController.LoginUser)


module.exports=router