require('dotenv').config();

console.log('Environment Variables Check:');
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL);

// Test OpenAI provider
const OpenAIProvider = require('./ai/providers/OpenAIProvider');

async function testOpenAI() {
  const provider = new OpenAIProvider();
  console.log('Provider name:', provider.getName());
  console.log('Provider available:', await provider.isAvailable());
}

testOpenAI().catch(console.error);
