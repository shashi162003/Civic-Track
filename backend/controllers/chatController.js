const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const handleChatMessage = async (req, res) => {
    const { message, history } = req.body;

    // Create a system prompt to give the AI its persona and context
    const systemPrompt = `
        You are the CivicConnect Assistant, a helpful and friendly AI.
        Your purpose is to answer user questions about the CivicConnect application and general civic issues.
        The app has the following features: reporting issues (like potholes, garbage), a real-time map, community events, a gamified leaderboard, and an SOS distress call feature.
        Keep your answers concise and helpful.
    `;

    const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
    ];

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: 0.7,
        });

        const aiResponse = response.choices[0].message.content;
        res.status(200).json({ reply: aiResponse });

    } catch (error) {
        console.error("Error with OpenAI Chat API:", error);
        res.status(500).json({ message: "Sorry, I'm having trouble connecting to my brain right now." });
    }
};

module.exports = { handleChatMessage };