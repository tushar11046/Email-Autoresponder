import { startService as gmailService } from "./src/services/gmailAutoresponder.js";
import { startService as outlookService } from "./src/services/outlookAutoresponder.js";
import { authorize as outlookAuthorize } from "./src/auth/outlook.js";
import { authorize as googleAuthorize } from "./src/auth/gmail.js"

async function initAuthorisation() {
    await googleAuthorize();
    await outlookAuthorize();
}

initAuthorisation()
    .then(() => {
        gmailService();
        outlookService();
    })
    .catch((error) => {
        console.log("Error while starting Service.");
        console.log(error);
    });