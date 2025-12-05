const userModel  = require('../models/user.model')
const jwt = require('jsonwebtoken')

async function authUser(req,res,next) {
    const {token} = req.cookies
    if(!token){
       return  res.json({
            message:"unauthorised"
        })
    }

    try {
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        const user = await userModel.findById(decoded.id)
        req.user = user

        next()
    } catch (error) {
        res.json({
            message :"no token found "
        })
        
    }
}

module.exports = {
    authUser
}