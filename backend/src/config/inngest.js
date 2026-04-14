import { Inngest } from "inngest";
import { connectDB } from "./db.js";
import { User } from "../models/user.model.js";
import { addUserToPublicChannels, deleteStreamUser, upsertStreamUser } from "./stream.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "collabhub" });

const syncUser = inngest.createFunction(
    {
        id: "sync-user",
        triggers: { event: "clerk/user.created" }
    },
    async ({ event }) => {
        await connectDB();
        const { id, email_addresses, first_name, last_name, image_url } = event.data;
        const newUser = {
            clerkId: id,
            email: email_addresses[0]?.email_address, // Fixed field name
            name: `${first_name || ""} ${last_name || ""}`.trim(),
            image: image_url,
        };
        await User.create(newUser);

        await upsertStreamUser({
            id: newUser.clerkId.toString(),
            name: newUser.name,
            image: newUser.image,
        });

        await addUserToPublicChannels(newUser.clerkId.toString());
    }
);

const deleteUserFromDB = inngest.createFunction(
    {
        id: "delete-user-from-db",
        triggers: { event: "clerk/user.deleted" }
    },
    async ({ event }) => {
        await connectDB(); // Added DB connection call
        const { id } = event.data;
        await User.deleteOne({ clerkId: id });

        await deleteStreamUser(id.toString());
    }
);

// Added deleteUserFromDB to the exported functions
export const functions = [syncUser, deleteUserFromDB];
