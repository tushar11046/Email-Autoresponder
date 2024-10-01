import { getGoogleClient } from "../auth/gmail.js";
import { delayBetweenRequests } from "../constants/other.js";
import { EmailQueue, ErrorQueue } from "../config/bullmq.js";
import { labelCategories } from "../constants/emailConfig.js";
import { delay } from "../utils/utility.js";
import { createLabelIfNotExists, getMessages } from "../utils/gmail.js";

async function addToQueue(messages) {
    try {
        const gmail = await getGoogleClient();

        let count = 0;

        for (const message of messages) {

            const msg = await gmail.users.messages.get({
                userId: 'me',
                id: message.id
            });

            console.log(msg);

            const payload = {
                message: msg.data
            }

            try {
                const response = await EmailQueue.add("Gmail", payload);

                if (response) {
                    ++count;
                    console.log('Number of email added: ', count);
                }
            } catch (error) {

                console.log("[GMAIL]: Error while adding to Queue, adding to Error Queue\n");
                console.log(error);

                await ErrorQueue.add("Gmail", payload);
            }
        }
    } catch (error) {
        console.log("[GMAIL]: Error while adding to queue.");
        console.log(error);
    }
}
async function reply(gmail) {

    const messages = await getMessages(gmail);

    if (messages == null) {
        console.log("[GMAIL]: No new Email arrived.");
    } else {
        console.log("[GMAIL]: Fetched messages: ", messages.length);

        addToQueue(messages);
    }
}

async function startService() {
    try {

        console.log("[GMAIL]: Starting Gmail Service...");

        const gmailClient = await getGoogleClient();

        const res = await gmailClient.users.getProfile({
            userId: "me",
          });
        
        console.log("[GMAIL] User: ",res.data.emailAddress);

        const labelPromises = labelCategories.map((label) =>
            createLabelIfNotExists(gmailClient, label)
        );

        let labels = null;

        try {
            labels = await Promise.all(labelPromises);
        } catch (error) {
            logger.error("[GOOGLE] Error creating all the labels");
            throw error;
        }


        try {
            while (true) {
                await reply(gmailClient, labels);

                await delay(delayBetweenRequests);
            }
        } catch (error) {
            console.log(error);
        }


    } catch (error) {
        console.log("[GMAIL]: Error while starting Autoresponder...");
        console.log(error);
    }
}

export { startService };