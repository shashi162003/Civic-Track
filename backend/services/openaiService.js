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

module.exports = { analyzeReport };