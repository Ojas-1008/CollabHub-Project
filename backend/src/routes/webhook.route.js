import express from "express";
import { streamClient } from "../config/stream.js";
import { inngest } from "../config/inngest.js";

const router = express.Router();

router.post("/stream", async (req, res) => {
    try {
        const signature = req.headers["x-signature"];
        
        // 1. Validate the Webhook
        // Stream uses a raw string payload to verify the signature. 
        // We need the raw body if it's parsed, but assuming express.json() is used globally,
        // we might pass the parsed object and streamClient.verifyWebhook accepts the parsed body + signature.
        // Actually streamClient.verifyWebhook accepts the unparsed raw body string.
        // However, standard express.json() converts to an object.
        // If stream SDK requires a raw string, we'll stringify it back.
        const valid = streamClient.verifyWebhook(JSON.stringify(req.body), signature);
        
        if (!valid) {
            return res.status(403).json({ error: "Invalid webhook signature" });
        }

        // 2. Route the webhook to Inngest
        const eventData = req.body;
        
        if (eventData.type === "message.new") {
            await inngest.send({
                name: "stream/message.new",
                data: eventData
            });
            console.log("✅ [Webhook] Pushed message.new event to Inngest");
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("❌ [Webhook Error]:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
