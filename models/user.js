const mongoose = require('mongoose');
const keys = require('../config/keys');
const { ObjectId } = mongoose.Schema.Types

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetToken: String,
    expireToken: Date,
    pic: {
        type: String,
        default: "https://res.cloudinary.com/durairaj/image/upload/v1598136288/images_tb3trv.png"
    },
    followers: [{ type: ObjectId, ref: 'User' }],
    following: [{ type: ObjectId, ref: 'User' }]
})

mongoose.model("User", userSchema)