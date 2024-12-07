import { ElevenLabsClient } from "elevenlabs";
const path = require("path");
const fs = require("fs").promises;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { poem } = req.body;
  
  if (!poem) {
    return res.status(400).json({ message: 'Poem text is required' });
  }

  if (!process.env.XI_API_KEY) {
    console.error('XI_API_KEY environment variable is not set');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  let poemText = poem.replace(/([.,;:])/g, "---------------");
  const voiceId = "GBv7mTt0atIp3Br8iCZE";

  const client = new ElevenLabsClient({
    apiKey: process.env.XI_API_KEY
  });

  try {
    const audioBuffer = await client.textToSpeech.convert(voiceId, {
      text: poemText,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    });

    const assetsDir = path.join(process.cwd(), 'public/assets');
    try {
      await fs.access(assetsDir);
    } catch {
      await fs.mkdir(assetsDir, { recursive: true });
    }

    const filePath = path.join(__dirname, '../../../../public/assets', 'generatedVoice.mp3');
    const fileUrl = '/assets/generatedVoice.mp3';

    await fs.writeFile(filePath, audioBuffer);
    console.log(`File written successfully to: ${filePath}`);
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(fileUrl);
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      message: 'Error generating voice',
      error: error.message
    });
  }
}