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
  let poemText = poem.replace(/([.,;:])/g, "$1-------------");

  const payload = {
    text: poemText,
    voice_settings: {
      similarity_boost: 0.5,
      stability: 0.5
    }
  };

  const headers = {
    'xi-api-key': process.env.XI_API_KEY,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.post("https://api.elevenlabs.io/v1/text-to-speech/GBv7mTt0atIp3Br8iCZE/stream", payload, { headers, responseType: 'arraybuffer' });
    const filePath = path.join(__dirname, '../../../../public/assets', 'generatedVoice.mp3');
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
