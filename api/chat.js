import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);

export default async function handler(req, res) {
  const { message, model, systemPrompt, thinking, agents } = req.body;

  // 1. Roda sub-agentes
  let agentResults = [];
  for (const agent of agents || []) {
    const prompt = `${agent.role}\n\nPergunta: ${message}`;

    let output = '';
    if (agent.model === 'aso-mini') {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      output = result.response.text();
    } else {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      });
      output = completion.choices[0].message.content;
    }
    agentResults.push({ name: agent.name, output });
  }

  // 2. Síntese final
  const context = agentResults.map(a => `**${a.name}**: ${a.output}`).join('\n\n');
  const finalPrompt = `${systemPrompt}\n\n${context? 'Contexto dos agentes:\n' + context + '\n\n' : ''}Pergunta do usuário: ${message}`;

  let finalAnswer = '';
  let reasoning = '';

  if (model === 'aso-mini') {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt
    });
    const result = await model.generateContent(finalPrompt);
    finalAnswer = result.response.text();
    reasoning = thinking? 'Analisei o contexto dos agentes e gerei resposta direta.' : '';
  } else {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: finalPrompt }
      ]
    });
    finalAnswer = completion.choices[0].message.content;
    reasoning = thinking? 'Considerei cada agente, ponderei contradições e sintetizei.' : '';
  }

  res.status(200).json({ answer: finalAnswer, reasoning, agents: agentResults });
}
