import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are Anju, a helpful and smart assistant.' },
        { role: 'user', content: message },
      ],
    });

    const reply = chatCompletion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('Error from OpenAI:', error);
    res.status(500).json({ reply: 'Oops! Anju is taking a break. Please try again later.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Anju backend running at http://localhost:${PORT}`);
});
