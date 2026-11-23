import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  
  try {
    const { message, model, systemPrompt, thinking, agents } = req.body || {};
    if (!message) return res.status(400).json({error:'Mensagem vazia'});

    // ... resto do código igual
