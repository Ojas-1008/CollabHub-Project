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
    },

    // ── EXTENDED PROFILE FIELDS ──────────────────────────────────────────
    // These are optional — users can fill them out from the Profile Page.

    bio: {
        type: String,
        default: "",
        maxLength: 160   // Short bio, like a Twitter bio
    },
    jobTitle: {
        type: String,
        default: ""
    },
    department: {
        type: String,
        default: ""
    },

    // Social media links — each one is an optional URL string.
    socialLinks: {
        github:   { type: String, default: "" },
        linkedin: { type: String, default: "" },
        twitter:  { type: String, default: "" },
        website:  { type: String, default: "" },
    },

    // Skills are stored as a simple array of strings.
    // Example: ["React", "Node.js", "MongoDB"]
    skills: {
        type: [String],
        default: []
    }
}, {timestamps: true});

export const User = mongoose.model("User", userSchema);