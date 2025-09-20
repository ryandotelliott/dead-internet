import OpenAI from "openai";

const openai: OpenAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export { openai };
