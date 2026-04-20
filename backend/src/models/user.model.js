import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true
    },
    clerkId: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        default: "",
        maxLength: 50
    }
}, {timestamps: true});

export const User = mongoose.model("User", userSchema);