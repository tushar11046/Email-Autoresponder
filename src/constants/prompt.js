const prompt = 
        ` Based on the following email content, classify the email into one of the following categories: 
        "Interested", "Not Interested", or "Need more Information". 
        Then provide a suitable reply to the email.

        You have to return a line where the assigned label and the reply should be seperated by underscore(_).
        The format of your answer should be:
        [Assigned Label]_[Email reply Content]

        Your answer example:

        1. Interested_Thank you for reaching out, lets book a call.
        2. Not Interested_Thank you for your time, have a great day.
        3. Need more Information_Thank you for reaching out, let's get on a call and resolve all your doubts.

        Do not include more than one underscore in the output. The reply should be a single sentence. Make sure to greet the sender first and appreciate them taking out the time to respond back and then add the business statement.
        

        Email content: `;


export { prompt };