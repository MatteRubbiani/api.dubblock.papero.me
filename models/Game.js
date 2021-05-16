const mongoose = require("mongoose")
require("dotenv").config()
mongoose.connect(process.env.MONGO_DB_URL, { useNewUrlParser: true, useUnifiedTopology: true})
const GameSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    adminUserId: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        required: true
    },
    blocks: {
        type: Array,
    },
    difficulty: {
        type: Number,
        default: 3
    },
    players: {
        type: Array,
        default:[]
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    rows: {
        type: Number,
        default: 0
    },
    columns: {
        type: Number,
        default: 0
    }
})

module.exports = mongoose.model("Games", GameSchema)