require('dotenv').config()
const app = require('./src/app')
const ConnectToDb = require('./src/db/db')
const initSocketServer = require('./src/sockets/socket.server')
const httpServer = require("http").createServer(app)

ConnectToDb()
initSocketServer(httpServer)


httpServer.listen(3000,()=>{
    console.log("server is running");
    
})