// pages/api/generateVoice.js

const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { poem } = req.body;
  let poemText = poem.replace(/([.,;:])/g, "                               ");

  const voiceId = "GBv7mTt0atIp3Br8iCZE"; // Make sure this is the correct voice ID
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const payload = {
    text: poemText,
    model_id: "eleven_monolingual_v1", // You can change this if needed
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.5
    }
  };

  const headers = {
    'xi-api-key': process.env.XI_API_KEY,
    'Accept': 'audio/mpeg',
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.post(url, payload, { 
      headers, 
      responseType: 'arraybuffer',
      maxBodyLength: Infinity
    });

    const filePath = path.join(process.cwd(), 'public/assets', 'generatedVoice.mp3');
    const fileUrl = `/assets/generatedVoice.mp3`;

    // Write the response data to a file using async/await
    await fs.writeFile(filePath, response.data);
    res.setHeader('Content-Type', 'text/plain');
    console.log("fileUrl: " + fileUrl);
    res.send(fileUrl);
  } catch (error) {
    console.error(`Error generating voice or saving file: ${error.message}`);
    res.status(error.response?.status || 500).json({ message: `Error generating voice or saving file: ${error.message}` });
  }
}
