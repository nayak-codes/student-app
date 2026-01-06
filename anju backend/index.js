// index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAIApi, Configuration } = require('openai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// OpenAI Configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Route for Anju to respond
app.post('/api/anju', async (req, res) => {
  const { message } = req.body;

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo', // Or 'gpt-4' if you have access
      messages: [
        { role: 'system', content: 'You are Anju, a smart and friendly educational assistant.' },
        { role: 'user', content: message }
      ],
    });

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('OpenAI Error:', error.message);
    res.status(500).json({ error: 'Something went wrong with Anju.' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Anju is live at http://localhost:${PORT}`);
});
