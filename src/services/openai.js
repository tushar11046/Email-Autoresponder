import OpenAI from "openai";
import { prompt } from '../constants/prompt.js';
import { getGoogleClient } from "../auth/gmail.js";
import { ErrorQueue } from "../config/bullmq.js";
import { getAuthClient } from "../utils/outlook.js";
import { labelCategories } from "../constants/emailConfig.js";
import { getLabelId, assignLabelToEmail, createRawEmail } from "../utils/gmail.js";
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function generateLabelAndReplyOutlook(payload) {
    try {

        const message = payload.message;

        const client = await getAuthClient();

        console.log("[OUTLOOK]: Replying to Subject:", message.subject);

        const emailBody = message.body.content;

        const ai = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "user",
                    content: prompt + emailBody,
                },
            ],
            temperature: 0.7,
            // max_tokens: 64,
            top_p: 1,
        });

        // const responseContent = response.choices[0].message.content;
        const completion = ai.choices[0]?.message?.content;

        const result = completion.split("_");

        var category = result[0];

        var reply = result[1];

        if (
            !result ||
            result.length !== 2 ||
            !labelCategories.includes(result[0]) ||
            result[1] === ""
        ){
            category = "Human Intervention Required";
            reply = "";
            
        }

        const updateContent = {

            categories: [category]

        };

        console.log("[OUTLOOK] CHECKING CLIENT: ", client);

        await client
            .api(`/me/messages/${message.id}`)
            .patch(updateContent);

        console.log(`[OUTLOOK]: Label "${category}" applied to message:`, message.id);

        await client
            .api(`/me/messages/${message.id}/reply`)
            .post({
                message: {
                    body: {
                        contentType: "Text",
                        content: reply
                    }
                }
            });


        console.log(result);

        console.log("[OUTLOOK]: Reply sent to message:", message.id);

        return;

    } catch (error) {

        console.log("[OUTLOOK]: Error while replying:", error);

        console.log("[OUTLOOK]: Adding to Error Queue.");

        await ErrorQueue.add("Outlook", payload);

        return null;

    }

}

const generateLabelAndReplyGmail = async (emailData) => {

    const gmail = await getGoogleClient();

    const emailBody = emailData.message.snippet;

    console.log("[GMAIL] Email data: ", emailData);

    console.log("[GMAIL] Email body: ", emailBody);

    const ai = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
            {
                role: "user",
                content: prompt + emailBody,
            },
        ],
        temperature: 0.7,
        // max_tokens: 64,
        top_p: 1,
    });

    // const responseContent = response.choices[0].message.content;
    const completion = ai.choices[0]?.message?.content;

    const result = completion.split("_");


    const category = result[0];

    const reply = result[1];

    console.log("reply: ", reply);

    console.log("Category: ", category);

    try {
        // Assign the category as a label

        console.log("[GMAIL]: LABEL NAME: ", category);

        const labelId = await getLabelId(gmail, category);

        console.log(labelId);

        await assignLabelToEmail(gmail, emailData.message.id, labelId);

        // Create the reply email
        const rawEmail = createRawEmail(emailData.message.payload.headers, reply, emailData);

        // Send the reply
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: rawEmail,
                threadId: emailData.message.threadId
            }
        });

        console.log(`[GMAIL]: Replied to email ID: ${emailData.id} with label "${category}"`);
    } catch (error) {

        console.log("[GMAIL]: Adding to Error Queue.");

        await ErrorQueue.add("Gmail", payload);

        console.error('[GMAIL]: Error generating label and reply:', error);
    }
};

export { generateLabelAndReplyOutlook, generateLabelAndReplyGmail };