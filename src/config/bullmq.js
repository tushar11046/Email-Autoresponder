import { Queue, Worker } from 'bullmq';
import { redisOptions } from './redisOptions.js';
import { generateLabelAndReplyOutlook, generateLabelAndReplyGmail } from '../services/openai.js';

const EmailQueue = new Queue('Fetched_Mails', { connection: redisOptions });

const ErrorQueue = new Queue('Failed_Reply', { connection: redisOptions });

const EmailWorker = new Worker('Fetched_Mails', async (job) => {

    console.log(`[GLOBAL]: Processing Job ${job.id}`);

    if (job.name == 'Outlook') {

        await generateLabelAndReplyOutlook(job.data);

    } else if (job.name == 'Gmail') {

        await generateLabelAndReplyGmail(job.data);

    }
    else {

        console.log(`Unknown job name ${job.name}`);

        return;
    }
}, { connection: redisOptions }
);

const ErrorWorker = new Worker('Failed_Reply', async (job) => {

    console.log(`[GLOBAL]: Processing failed Job ${job.id}`);

    if (job.name == 'Outlook') {

        await generateLabelAndReplyOutlook(job.data);

        console.log("[Outlook]: Mail successfully sent: ");

    } else if (job.name == 'Gmail') {
        console.log("[GMAIL]: Jobs are: ", job.data);

       await generateLabelAndReplyGmail(job.data);

       console.log("[GMAIL]: Mail successfully sent: ");
    }
    else {

        console.log(`Unknown job name ${job.name}`);

        return;
    }
}, { connection: redisOptions }
);

export { EmailQueue, ErrorQueue };