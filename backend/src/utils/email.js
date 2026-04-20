import { Resend } from 'resend';
import { ENV } from '../config/env.js';

// NOTE: We create the Resend client INSIDE the function (not here at the top).
// This is called "lazy initialization". If we created it here and RESEND_API_KEY
// was missing, the entire server would crash immediately on startup.
// By creating it inside the function, a missing key only causes email sending to
// fail gracefully — not the whole server.

export const sendOfflineNotificationEmail = async ({
    email,
    name,
    senderName,
    messageText,
    channelName
}) => {
    try {
        // Create the client here, inside the function. This is "lazy initialization".
        // If RESEND_API_KEY is missing, it only fails when an email is sent — 
        // not when the server starts up.
        if (!ENV.RESEND_API_KEY) {
            console.warn("⚠️ [Email] RESEND_API_KEY is not set. Skipping email.");
            return { success: false, error: "RESEND_API_KEY not configured" };
        }
        const resend = new Resend(ENV.RESEND_API_KEY);

        const { data, error } = await resend.emails.send({
            from: 'CollabHub <onboarding@resend.dev>',
            to: email,
            subject: `New message from ${senderName} in CollabHub`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #4f46e5;">CollabHub Notification</h2>
                    <p>Hi <strong>${name}</strong>,</p>
                    <p>You have a new message from <strong>${senderName}</strong> ${channelName ? `in <strong>${channelName}</strong>` : ''}:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4f46e5; border-radius: 4px; margin-bottom: 20px;">
                        <p style="margin: 0; color: #333;">"${messageText}"</p>
                    </div>
                    <p>
                        <a href="${ENV.FRONTEND_URL}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #4f46e5; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            View Message
                        </a>
                    </p>
                    <p style="font-size: 12px; color: #888; margin-top: 30px;">
                        You received this because you were offline when someone tried to reach you.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error("Resend Email Error:", error);
            return { success: false, error };
        }

        console.log(`✅ [Email Utilty] Sent offline notification email to ${email}`);
        return { success: true, data };
    } catch (err) {
        console.error("Failed to send offline email:", err);
        return { success: false, error: err };
    }
};
