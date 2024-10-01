import { getExcludeQuery } from '../constants/emailConfig.js';
async function getMessages(gmail) {
    try {

        const timeBeforeDelay = Math.floor(
            Number(new Date(Date.now() - 100 * 60 * 1000)) / 1000
        );

        let messages = null;

        const res = await gmail.users.messages.list({
            userId: 'me',
            q: `is:unread after:${timeBeforeDelay}` + getExcludeQuery()
        })

        messages = res.data.messages || null;

        if(messages == null){
            
            console.log("[GMAIL] No New Mails: \n");

            return null;
        }

        console.log("[GMAIL] New fetched messages count: \n", messages.length);

        return messages;

    } catch (error) {
        console.log("[GMAIL] Error while fetching Emails...\n");
        console.log(error);
    }
}

// Function to check if a label with the given name exists
async function findLabel(gmail, labelName) {
    try {
        const res = await gmail.users.labels.list({
            userId: 'me',
        });

        const labelsList = res.data.labels || [];

        const label = labelsList.find(
            (label) => label.name?.toLowerCase() === labelName.toLowerCase()
        );

        return label || null;
    } catch (error) {
        console.error(`[GMAIL] Error fetching labels: ${error.message}`);
        return null;
    }
}

// Function to create a label if it does not exist yet
async function createLabelIfNotExists(gmail, labelName) {
    try {
        let label = await findLabel(gmail, labelName);

        if (!label) {
            console.debug(`[GMAIL] Label "${labelName}" not found`);

            const res = await gmail.users.labels.create({
                userId: 'me',
                requestBody: {
                    labelListVisibility: 'labelShow',
                    messageListVisibility: 'show',
                    name: labelName,
                },
            });

            label = res.data;
            console.debug(`[GMAIL] Created label "${labelName}\n"`);
        } else {
            console.debug(`[GMAIL] Label "${labelName}" already present`);
        }

        return label;
    } catch (error) {
        console.error(`[GMAIL] Error creating label: ${error.message}`);
        return null;
    }
}

const createLabel = async (gmail, labelName) => {
    try {
        const response = await gmail.users.labels.create({
            userId: 'me',
            requestBody: {
                name: labelName,
                labelListVisibility: 'labelShow',
                messageListVisibility: 'show'
            }
        });

        console.log(`[GMAIL]: Created new label: ${labelName}`);
        return response.data;
    } catch (error) {
        console.error(`[GMAIL]: Error creating label "${labelName}":`, error);
        throw error;
    }
};

const getLabelId = async (gmail, labelName) => {
    try {
        const response = await gmail.users.labels.list({
            userId: 'me',
        });

        const labels = response.data.labels;

        // Check if the label exists
        const label = labels.find(label => label.name.toLowerCase() === labelName.toLowerCase());
        return label ? label.id : await createLabel(gmail, labelName).then(newLabel => newLabel.id);
    } catch (error) {
        console.error('[GMAIL]: Error fetching labels:', error);
        throw error;
    }
};

const assignLabelToEmail = async (gmail, emailId, labelId) => {
    try {
        await gmail.users.messages.modify({
            userId: 'me',
            id: emailId,
            requestBody: {
                addLabelIds: [labelId],
            },
        });

        console.log(`[GMAIL]: Label ID "${labelId}" assigned to email ID "${emailId}".`);
    } catch (error) {
        console.error('Error assigning label to email:', error);
        throw error;
    }
};

function createRawEmail(headers, replyContent, originalMessage) {

    const to = headers.find(header => header.name === 'From').value;

    const subject = originalMessage.message.payload.headers.find(header => header.name === 'Subject').value;

    const messageId = originalMessage.message.payload.headers.find(header => header.name === 'Message-ID').value;

    const raw = [
        `From: me`,
        `To: ${to}`,
        `Subject: Re ${subject}`,
        `In-Reply-To: ${messageId}`,
        `References: ${messageId}`,
        `\n${replyContent}`
    ].join('\n');

    return Buffer.from(raw).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export { createLabelIfNotExists, getMessages, getLabelId, assignLabelToEmail, createRawEmail };