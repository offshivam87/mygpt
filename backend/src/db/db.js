const mongoose = require('mongoose')

async function ConnectToDb() {

    try {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("CONNECTED TO DB");
        
    } catch (error) {
        console.error("error connecting to mongoDB", error)
    }
    
    
}

module.exports = ConnectToDb