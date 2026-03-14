const Groq = require('groq-sdk');
const Product = require('../models/Product');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.chatAssistant = async (req, res) => {
    try {
        const { message } = req.body;
        const allProducts = await Product.find({}).limit(20);
        const productContext = allProducts.map(p => `${p.productName} ($${p.price}) - ${p.category}`).join(', ');

        const prompt = `You are an AI Shopping Assistant for a SaaS E-Commerce platform. 
        Context: The following products are available in store: ${productContext}.
        User message: ${message}
        Reply concisely and help the user find the right product.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: prompt }, { role: 'user', content: message }],
            model: 'llama-3.1-8b-instant',
        });

        res.json({ reply: chatCompletion.choices[0]?.message?.content });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
