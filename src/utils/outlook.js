import { Client } from '@microsoft/microsoft-graph-client';
import { EmailQueue, ErrorQueue } from '../config/bullmq.js';
import { authorize } from '../auth/outlook.js';

async function getAuthClient() {
    const credentials = await authorize();

    const authProvider = (callback) => {

        if (!credentials || !credentials.accessToken) {

            callback(new Error("Failed to retrieve access token"), null);

        } else {

            callback(null, credentials.accessToken);

        }
    };

    let options = {

        authProvider,

    };

    const client = Client.init(options);

    return client;
};

async function getUnreadEmails() {
    try {

        const client = await getAuthClient();

        // Gets emails received in the last 2 minutes
        
        const timeBeforeDelay = new Date(
            Date.now() - 100000 * 60 * 1000
        ).toISOString();

        const messages = await client
            .api("/me/messages")
            .header('Prefer', 'outlook.body-content-type="text"')
            .select('subject,body,bodyPreview,uniqueBody,categories')
            .filter(`isRead eq false and receivedDateTime ge ${timeBeforeDelay} and (not categories/any(c: c eq 'Interested') and not categories/any(c: c eq 'Not Interested') and not categories/any(c: c eq 'Need more information'))`)
            .orderby("receivedDateTime desc")
            .get();


        if(messages.value.length==0){
            console.log("[OUTLOOK]: No new Mail: ");
        }else {
            console.log("[OUTLOOK]: New fetched messages count: ", messages.value.length);
        }

        return messages;

    } catch (error) {

        console.log(error);

        return null;

    }
}

async function addToQueue(messages) {
    try {
        for (const email of messages.value) {

            const payload = {
                message: email,
                
            };

            try {

                const response = await EmailQueue.add("Outlook", payload);

                let count = 0;

                if (response) {
                    count++;
                    console.log('Number of email added: ', count);
                }
            } catch (error) {
                await ErrorQueue.add("Outlook", payload);
                console.log("[OUTLOOK]: Error while adding to Queue, adding to Error Queue ", error);

            }
        }
    } catch (error) {
        console.log("[OUTLOOK] Error: ", error);
    }
}

async function processEmails() {

    console.log('[Outlook fetching unread emails.]');

    const emails = await getUnreadEmails();

    if (emails.value.length == 0) {
        console.log('[Outlook] No new mail arrived.');
    }

    // add mails to bullmq

    await addToQueue(emails);

}

export { getAuthClient, processEmails };