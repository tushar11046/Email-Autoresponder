# Email-Autoresponder

1- Clone the repository to local machine

2- Download the credentials from the Google Cloud console by following the instructions here: 
https://developers.google.com/gmail/api/quickstart/nodejs  and save them in credentials.json file of the application. It should look something like this

{"web":
    {
        "client_id":"",
        "project_id":"",
        "auth_uri":"",
        "token_uri":"",
        "auth_provider_x509_cert_url":"",
        "client_secret":"",
        "redirect_uris":[""]
    }
}

Similarly setup an Azure app registration in the Azure cloud and save the config constant in the src/auth/outlook.js file
const config = {

    auth: {

        clientId: 'YOUR_CLIENT_ID',

        authority: 'https://login.microsoftonline.com/common',

        clientSecret: 'YOUR_CLIENT_SECRET',

        redirectUri: 'http://localhost:3000/callback'

    },

};

add OPENAI_API_KEY that you need to create from the openai website in the openai.js file

run node index.js

Login to your Google account

Enjoy your vacations!
