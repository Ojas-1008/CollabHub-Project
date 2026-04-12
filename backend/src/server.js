import express from 'express';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';

const app = express();

app.get("/", (req, res) => {
    res.send("Hello World!");
});

console.log("mongo uri: ", ENV.MONGO_URI)

app.listen(ENV.PORT, () => {
    console.log("Server started on port: ", ENV.PORT);
    connectDB();
});