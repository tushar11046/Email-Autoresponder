import { getAuthClient,processEmails } from '../utils/outlook.js';
import { delayBetweenRequests } from "../constants/other.js";
import { delay } from '../utils/utility.js';

async function startService() {

    console.log("[OUTLOOK]: Starting Outlook Service...");

    const client = await getAuthClient();
  
    const user = await client.api("/me").get();
    console.log(`[OUTLOOK] User: ${user.mail}`);
  
    try {
      while (true) {
        await processEmails();

        await delay(delayBetweenRequests);
      } 
    } catch (error) {
      console.log(error);
    }
}

export {startService};