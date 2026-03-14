const Groq = require('groq-sdk');
const Product = require('../models/Product');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

exports.getRecommendations = async (req, res) => {
    try {
        const { userId } = req.params;
        // In a real app, we would fetch UserActivity, History etc.
        // For now, we simulate AI giving dynamic recommendations.
        const allProducts = await Product.find({}).limit(50);
        const productList = allProducts.map(p => `${p.productName} in ${p.category} at $${p.price}`).join('; ');

        const prompt = `Based on a user browsing an e-commerce platform, pick the 3 best recommendations from this list of products: ${productList}. Return ONLY a JSON array of their names, no explanations.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
        });

        const reply = chatCompletion.choices[0]?.message?.content || "[]";
        
        // rudimentary parsing
        let recommendedNames = [];
        try {
            recommendedNames = JSON.parse(reply);
        } catch(e) {
            recommendedNames = [];
        }

        const recommendations = await Product.find({ productName: { $in: recommendedNames } });
        res.json(recommendations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
