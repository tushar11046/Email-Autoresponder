import { promises as fs } from "fs";
import process from "process";
import path from "path";

import { authenticate } from "@google-cloud/local-auth";
import { google} from "googleapis";

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify', 
    'https://www.googleapis.com/auth/gmail.labels'
];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function loadSavedCredentialsIfExist() {

    try {

        const content = await fs.readFile(TOKEN_PATH);

        const credentials = JSON.parse(content);

        const { client_secret, client_id, refresh_token } = credentials;

        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret);

        oAuth2Client.setCredentials({ refresh_token });

        return oAuth2Client;


    } catch (err) {

        return null;
    }
}

async function saveCredentials(client) {

    const content = await fs.readFile(CREDENTIALS_PATH);

    const keys = JSON.parse(content);

    const key = keys.installed || keys.web;

    const payload = JSON.stringify({

        type: 'authorized_user',

        client_id: key.client_id,

        client_secret: key.client_secret,

        refresh_token: client.credentials.refresh_token,

    });

    await fs.writeFile(TOKEN_PATH, payload);

}

async function authorize(){
    try {
        let client = await loadSavedCredentialsIfExist();

        if (client) {
            return client;
        }

        client = await authenticate({
            scopes: SCOPES,
            keyfilePath: CREDENTIALS_PATH,
        });

        if (client.credentials) {
            await saveCredentials(client);
        }

        console.log("[GMAIL]: New client Authenticated");

        return client;

    } catch (error) {

        console.log("[GMAIL]: Error while authenticating: ", error);

    }
}

async function getGoogleClient(){

    const auth = await authorize();

    const gmailClient = google.gmail({version: "v1", auth});

    return gmailClient;
}

export { getGoogleClient, authorize };