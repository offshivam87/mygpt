const chatModel = require('../models/chat.model')


async function createChat(req,res) {
    const {title} = req.body
    const user = req.user 

    const chat = await chatModel.create({
        user:user._id,
        title
    })

    res.status(201).json({
        message:"chat created succesfully",
        chat
    })
    
}

async function getChats(req,res) {
    const user = req.user;

    const chat = await chatModel.find({user:user._id})
    res.status(200).json({
        message:"chats retrived successfully",
        chats: chat.map(chat=>({
            _id:chat._id,
            title:chat.title,
            lastActivity:chat.lastActivity,
            user:chat.user
        }))
    })
    
}

module.exports = {
    createChat,
    getChats
}