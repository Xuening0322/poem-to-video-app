import { ElevenLabsClient } from "elevenlabs";
const path = require("path");
const fs = require("fs").promises;
const { Storage } = require('@google-cloud/storage');
const { Readable } = require('stream');

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

  try {
    // Initialize GCP Storage
    const storage = new Storage();
    const bucket = storage.bucket('poem-to-video');

    let poemText = poem.replace(/([.,;:])/g, "---------------");
    const voiceId = "GBv7mTt0atIp3Br8iCZE";

    const client = new ElevenLabsClient({
      apiKey: process.env.XI_API_KEY
    });

    // Generate audio from ElevenLabs
    const audioBuffer = await client.textToSpeech.convert(voiceId, {
      text: poemText,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    });

    // Save locally first
    const filePath = path.join(__dirname, '../../../../public/assets', 'generatedVoice.mp3');
    await fs.writeFile(filePath, audioBuffer);
    console.log(`File written successfully to: ${filePath}`);

    // Generate a unique filename for GCS
    const gcsFilename = `generatedVoice_${Date.now()}.mp3`;
    const file = bucket.file(gcsFilename);

    // Upload file from disk to GCS
    await bucket.upload(filePath, {
      destination: gcsFilename,
      metadata: {
        contentType: 'audio/mpeg'
      }
    });

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFilename}`;

    // Return both local and GCS URLs
    res.status(200).json({
      localUrl: '/assets/generatedVoice.mp3',
      gcsUrl: publicUrl,
      filename: gcsFilename
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      message: 'Error in file operations',
      error: error.message
    });
  }
}