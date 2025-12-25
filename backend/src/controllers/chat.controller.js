const chatModel = require('../models/chat.model')
const messageModel = require('../models/message.model')


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

    const chat = await chatModel.find({user:user._id}).sort({ updatedAt: -1 })
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

async function getMessages(req,res) {
    const chatId = req.params.id
    const messages = await messageModel.find({chat:chatId})
    res.status(200).json({
        message:"messages recieved successfully",
        messages:messages
    })
    
}

module.exports = {
    createChat,
    getChats,
    getMessages
}