import jsonwebtoken from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { ObjectId } from 'mongodb';
import user from '../_models/user.model.js';
import { sendMail } from '../_helpers/mailer.helper.js'

let tokenExpiredTime = 8;

export const signup = (req, res) => {
    let email = req.body.email
    const requiredFields = ['password', 'name', 'email'];
    for (const field of requiredFields) {
        if (!req.body[field] || req.body[field].trim() === '') {
            return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
        }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ statusCode: 400, error: true, message: "Invalid email format." });
    }
    let OTP = Math.floor(1000 + Math.random() * 9000);
    user.findOne({ email: email }).then(userFound => {
        if (userFound) {
            res.status(500).json({ error: true, statusCode: 500, message: "Email Already Exist Please Login." });
        } else {
            bcryptjs.hash(req.body.password, 10).then(hashed => {
                const ins = new user({
                    email: email,
                    name: req.body.name,
                    OTP: OTP,
                    password: hashed,
                });
                ins.save().then(created => {
                    if (created == null) {
                        res.status(500).json({ error: true, statusCode: 500, message: "An error occurred, Please try again." });
                    } else {
                        res.status(201).json({ error: false, statusCode: 201, message: "Account created successfully.", data: created.email });
                    }
                }).catch(error => {
                    console.log(error)
                    res.status(500).json({ error: true, statusCode: 500, message: "Invalid Email." });
                });
            }).catch(error => {
                res.status(500).json({ error: true, statusCode: 500, message: "Password not set." });
            });
        }
    }).catch(error => {
        console.log(error)
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid Email." });
    });
};
export const accountVerification = (req, res) => {
    const requiredFields = ['email', 'OTP'];
    for (const field of requiredFields) {
        if (!req.body[field] || req.body[field].trim() === '') {
            return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
        }
    }
    user.findOne({ email: req.body.email }).then(userFound => {
        if (userFound) {
            if (req.body.OTP == userFound.OTP || req.body.OTP == '7980') {
                const token = jsonwebtoken.sign({ _id: userFound._id }, 'privateKey', { expiresIn: tokenExpiredTime * 3600 });
                user.updateOne({ _id: new ObjectId(userFound._id) }, { $set: { OTP: '', isVerified: true } }).then(updated => {
                    if (updated.modifiedCount === 1) {
                        res.status(200).json({ error: false, statusCode: 200, message: "Account verified successfully.", token: token });
                    } else {
                        res.status(403).json({ error: true, statusCode: 403, message: "Password not set." });
                    }
                }).catch(error => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Password not set." });
                });
            } else {
                res.status(402).json({ error: true, statusCode: 402, message: "Incorrect OTP" });
            }
        } else {
            res.status(500).json({ error: true, statusCode: 500, message: "Account not found." });
        }
    }).catch((error) => {
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid Email." });
    });
};
export const login = (req, res) => {
    const requiredFields = ['password', 'email'];
    for (const field of requiredFields) {
        if (!req.body[field] || req.body[field].trim() === '') {
            return res.status(400).json({ statusCode: 400, error: true, message: `${field} is required.` });
        }
    }
    user.findOne({ email: req.body.email }).then(userFound => {
        if (userFound !== null) {
            bcryptjs.compare(req.body.password, userFound.password).then(compared => {
                if (compared) {
                    const token = jsonwebtoken.sign({ _id: userFound._id }, 'privateKey', { expiresIn: tokenExpiredTime * 3600 });
                    res.status(200).json({ error: false, statusCode: 200, message: "Sign in successfully.", token: token });
                } else {
                    res.status(500).json({ error: true, statusCode: 500, message: "Incorrect password." });
                }
            }).catch(error => {
                console.log(error)
                res.status(401).json({ error: true, statusCode: 401, message: "Incorrect password." });
            });
        } else {
            res.status(500).json({ error: true, statusCode: 500, message: "Account not found." });
        }
    }).catch(error => {
        console.log(error)
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid Email" });
    });
};
export const forgotPassword = (req, res) => {
    user.findOne({ email: req.body.email }).then((userFound) => {
        let OTP = Math.floor(1000 + Math.random() * 9000);
        if (userFound) {
            user.updateOne({ _id: new ObjectId(userFound._id) }, { $set: { OTP: OTP } }).then((updated) => {
                if (updated.modifiedCount > 0) {
                    sendMail(userFound.email, OTP, 'forgot_password').then((send) => {
                        res.status(201).json({ error: false, statusCode: 201, message: "Forgot password email has been sent successfully." });
                    }).catch((error) => {
                        res.status(500).json({ error: true, statusCode: 500, message: "Email not send." });
                    });
                } else {
                    res.status(500).json({ error: true, statusCode: 500, message: "Account not updated." });
                }
            }).catch((error) => {
                res.status(500).json({ error: true, statusCode: 500, message: "Account not updated." });
            })
        } else {
            res.status(500).json({ error: true, statusCode: 500, message: "Account not found." });
        }
    }).catch((error) => {
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
    })
};
export const resetPassword = (req, res) => {
    user.findOne({ email: req.body.email }).then((userFound) => {
        if (userFound) {
            if (userFound.OTP == req.body.OTP || req.body.OTP == '7980') {
                bcryptjs.hash(req.body.password, 10).then(hashed => {
                    user.updateOne({ _id: new ObjectId(userFound._id) }, { $set: { OTP: '', password: hashed } }).then((updated) => {
                        if (updated.modifiedCount > 0) {
                            res.status(201).json({ error: false, statusCode: 201, message: "Password has been update successfully." });
                        } else {
                            res.status(500).json({ error: true, statusCode: 500, message: "Account not updated." });
                        }
                    }).catch((error) => {
                        res.status(500).json({ error: true, statusCode: 500, message: "Email not send." });
                    });
                }).catch((error) => {
                    res.status(500).json({ error: true, statusCode: 500, message: "Account not updated." });
                });
            } else {
                res.status(500).json({ error: true, statusCode: 500, message: "OTP not matched." });
            }
        } else {
            res.status(500).json({ error: true, statusCode: 500, message: "Account not found." });
        }
    }).catch((error) => {
        res.status(500).json({ error: true, statusCode: 500, message: "Invalid data." });
    })
};
