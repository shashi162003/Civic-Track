const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const analyzeReport = async (description) => {
    try {
        const prompt = `
            Analyze the following civic issue description and return a JSON object with three keys: "title", "category", and "severity".

            - "title": A concise, descriptive title for the issue (max 10 words).
            - "category": Classify the issue into one of the following categories: ['Waste', 'Roads', 'Lighting', 'Water', 'Other'].
            - "severity": Classify the severity of the issue as one of the following: ['Low', 'Medium', 'High'].

            Description: "${description}"

            JSON Response:
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
        });

        const result = JSON.parse(response.choices[0].message.content);
        return result;

    } catch (error) {
        console.error("Error with OpenAI API:", error);
        return {
            title: "Manual Review Required",
            category: "Other",
            severity: "Medium",
        };
    }
};

const moderateContent = async (text) => {
    try {
        const response = await openai.moderations.create({
            input: text,
        });
        return response.results[0].flagged;
    } catch (error) {
        console.error("Error with OpenAI Moderation API:", error);
        return false;
    }
};

const findDuplicateReport = async (newDescription, existingReports) => {
    try {
        const prompt = `
            You are a duplicate detection system for a civic issue reporting app.
            A user has submitted a new report description. Compare it to the list of existing, nearby report descriptions.
            If the new report is describing the same fundamental issue as one of the existing reports, return a JSON object with a single key, "duplicateReportId", containing the ID of the original report.
            If it is a new, unique issue, return { "duplicateReportId": null }.

            New Report Description: "${newDescription}"

            Existing Reports (Array of objects with id and description):
            ${JSON.stringify(existingReports)}

            JSON Response:
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125",
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
        });

        const result = JSON.parse(response.choices[0].message.content);
        return result.duplicateReportId;

    } catch (error) {
        console.error("Error with OpenAI duplicate detection:", error);
        return null;
    }
};

const parseSearchQuery = async (query) => {
    try {
        const prompt = `
            You are an API search assistant. Analyze the user's search query for a civic issue app and convert it into a JSON object.
            The possible keys for the JSON are "category", "status", "severity", and "keyword".
            - The allowed values for "category" are: ['Waste', 'Roads', 'Lighting', 'Water', 'Other'].
            - The allowed values for "status" are: ['Pending', 'In Progress', 'Resolved'].
            - The allowed values for "severity" are: ['Low', 'Medium', 'High'].
            - "keyword" should contain any remaining important nouns or descriptive terms.
            If a filter is not mentioned in the query, omit its key from the JSON.

            User Query: "${query}"

            JSON Response:
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125",
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
            temperature: 0.2,
        });

        return JSON.parse(response.choices[0].message.content);

    } catch (error) {
        console.error("Error parsing search query with OpenAI:", error);
        return { keyword: query };
    }
};

module.exports = { analyzeReport, moderateContent, findDuplicateReport, parseSearchQuery };