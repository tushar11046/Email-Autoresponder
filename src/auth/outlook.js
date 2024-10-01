import { promises as fs } from 'fs';
import path from 'path';
import process from 'process';
import url from 'url';
import { ConfidentialClientApplication } from '@azure/msal-node';
import http from 'http';
import { Client } from '@microsoft/microsoft-graph-client';


const config = {

    auth: {

        clientId: 'YOUR_CLIENT_ID',

        authority: 'https://login.microsoftonline.com/common',

        clientSecret: 'YOUR_CLIENT_SECRET',

        redirectUri: 'http://localhost:3000/callback'

    },

};

const SCOPES = ['user.Read', 'Mail.ReadWrite', 'Mail.Send', 'offline_access'];

const TOKEN_PATH = path.join(process.cwd(), 'outlookToken.json');

const cca = new ConfidentialClientApplication(config);

async function loadSavedCredentialsIfExist() {

    try {

        const content = await fs.readFile(TOKEN_PATH);

        const credentials = JSON.parse(content);

        return credentials;

    } catch (err) {

        return null;    

    }
}

async function saveCredentials(tokenResponse) {

    const tokenData = {

        accessToken: tokenResponse.accessToken,

        clientId: config.auth.clientId,

        clientSecret: config.auth.clientSecret,

        tenantId: 'YOUR_TENANT_ID'

    };

    const payload = JSON.stringify(tokenData);

    await fs.writeFile(TOKEN_PATH, payload);

    return tokenResponse;
}

async function authorize() {

    let outlookCredentials = await loadSavedCredentialsIfExist();

    if (outlookCredentials) {

        return outlookCredentials;
    }

    const authCodeUrlParameters = {

        scopes: SCOPES,

        redirectUri: 'http://localhost:3000/callback'

    };

    const authCodeUrl = await cca.getAuthCodeUrl(authCodeUrlParameters);

    console.log('\nVisit the URL to get Auth Code: ');

    console.log(authCodeUrl);

    const server = http.createServer(async (req, res) => {

        if (req.url.startsWith("/callback")) {

            const qs = new url.URL(req.url, "http://localhost:3000").searchParams;

            const authCode = qs.get("code");

            if (authCode) {

                res.end("[OUTLOOK]: Authentication successful! You can close this window.");

                const tokenRequest = {
                    clientId: config.auth.clientId,
                    code: authCode,
                    scopes: SCOPES,
                    redirectUri: config.auth.redirectUri,
                    clientSecret: config.auth.clientSecret,
                };

                try {
                    const tokenResponse = await cca.acquireTokenByCode(tokenRequest);

                    outlookCredentials = await saveCredentials(tokenResponse);

                    server.close(() => console.log("Server closed!"));

                    return outlookCredentials;

                } catch (error) {

                    console.log(error);

                    res.end("Error acquiring token");

                    server.close(() => console.log("Server closed!"));

                }
            } else {

                res.end("Authentication failed");

                server.close(() => console.log("Server closed!"));

            }
        }
    });

    server.listen(3000, () => {
        console.log(
            "Listening on http://localhost:3000/callback for the auth code"
        );
    });

    await new Promise((resolve) => {
        server.on("close", resolve);
        server.on("close", () => console.log("Server closed"));
    });

    return outlookCredentials;
}

async function getAuthClient() {
    const credentials = await authorize();

    const authProvider = (callback) => {

        if (!credentials || !credentials.accessToken) {

            callback(new Error("[OUTLOOK]: Failed to retrieve access token"), null);
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

export { authorize };