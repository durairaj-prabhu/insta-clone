const express = require('express');
const router = express.Router();
const mongoose = require('mongoose')
const User = mongoose.model('User')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/keys')
const requireLogin = require('../middleware/requireLogin')
const nodemailer = require('nodemailer')
const sendgridTransport = require('nodemailer-sendgrid-transport')
const {SENDGRID_API,EMAIL} = require('../config/keys')

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: SENDGRID_API
    }
}))

router.post('/signup', (req, res) => {
    const { name, email, password, pic } = req.body
    if (!email || !password || !name) {
        return res.status(422).json({ error: "please add all the fields" })
    }
    User.findOne({ email: email })
        .then((savedUser) => {
            if (savedUser) {
                return res.status(422).json({ error: "user already exists with that email" })
            }
            bcrypt.hash(password, 10).then(hashedpassword => {
                const user = new User({
                    email,
                    password: hashedpassword,
                    name,
                    pic
                })
                user.save()
                    .then(user => {
                        transporter.sendMail({
                            to: user.email,
                            from: "techytro@gmail.com",
                            subject: "Sign up Success",
                            html: "<h3> Welcome to Insta Clone</h3>"
                        })
                        res.json({ "message": "saved successfully" })
                    })
                    .catch(err => {
                        console.log(err)
                    })
            })
        })
        .catch(err => {
            console.log(err)
        })
})

router.post('/signin', (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(422).json({ error: "Please provide Email or Password" })
    }
    User.findOne({ email: email }).then(savedUser => {
        if (!savedUser) {
            return res.status(422).json({ error: "Invalid Email or Password" })
        }
        bcrypt.compare(password, savedUser.password).then(doMatch => {
            if (doMatch) {
                // res.json({"message": "Successfully signed in"})
                const token = jwt.sign({ _id: savedUser._id }, JWT_SECRET)
                const { _id, name, email, followers, following, pic } = savedUser
                res.json({ token, user: { _id, name, email, followers, following, pic } })
            } else {
                return res.status(422).json({ error: "Invalid Email or Password" })
            }
        })
            .catch(err => {
                console.log(err)
            })
    })
})

router.post('/reset-password', (req, res) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err)
        } else {
            const token = buffer.toString("hex")
            User.findOne({ email: req.body.email })
                .then(user => {
                    if (!user) {
                        return res.status(422).json({ error: "User not found" })
                    }
                    user.resetToken = token
                    user.expireToken = Date.now() + 3600000
                    user.save().then(result => {
                        transporter.sendMail({
                            to: user.email,
                            from: "techytro@gmail.com",
                            subject: "password reset",
                            html: `
                        <p>You have requested for Password reset</p>
                        <h5>click this <a href="${EMAIL}/reset/${token}">link</a> to reset your password</h5>`
                        })
                        res.json({ message: "Check your email" })
                    })
                })
        }
    })
})

router.post('/new-password', (req, res) => {
    const newPassword = req.body.password
    const sentToken = req.body.token
    User.findOne({ resetToken: sentToken, expireToken: { $gt: Date.now() } })
        .then(user => {
            if (!user) {
                return res.status(422).json({ error: "Session expired! Try again!!" })
            }
            bcrypt.hash(newPassword, 12).then(hashedpassword => {
                user.password = hashedpassword
                user.resetToken = undefined
                user.expireToken = undefined
                user.save().then((saveduser) => {
                    res.json({ message: "Your password has been updated successfully !!!" })
                })
            })
        }).catch(err => {
            console.log(err)
        })
})

module.exports = router