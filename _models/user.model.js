import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const user = new Schema({
    name: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true, required: true },
    password: { type: String },
    OTP: { type: String },
},
    { versionKey: false, timestamps: true });

export default model('user', user);
