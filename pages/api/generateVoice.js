import { ElevenLabsClient } from "elevenlabs";
import path from "path";
import fs from "fs/promises";
import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: path.join(process.cwd(), 'gcp-key.json')
});
const bucket = storage.bucket('poem-to-video');

async function uploadToGCP(filePath, gcsFilename) {
  try {
    console.log('Starting upload for file:', gcsFilename);
    
    // Upload file to GCS
    await bucket.upload(filePath, {
      destination: gcsFilename,
      metadata: {
        contentType: 'audio/mpeg'
      }
    });

    const publicUrl = `https://storage.googleapis.com/poem-to-video/${encodeURIComponent(gcsFilename)}`;
    console.log('File uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

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
    const assetsDir = path.join(process.cwd(), 'public/assets');
    await fs.mkdir(assetsDir, { recursive: true });
    const localFilename = 'generatedVoice.mp3';
    const filePath = path.join(assetsDir, localFilename);
    await fs.writeFile(filePath, audioBuffer);
    console.log(`File written successfully to: ${filePath}`);

    try {
      // Generate timestamp-based filename for GCS
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const gcsFilename = `voices/${timestamp}-voice.mp3`;

      // Upload the local file to GCP
      const publicUrl = await uploadToGCP(filePath, gcsFilename);
      
      // Still return local URL for now
      res.status(200).send('/assets/generatedVoice.mp3');
    } catch (uploadError) {
      console.error('GCS upload failed, falling back to local URL:', uploadError);
      // If GCS upload fails, return just the local URL
      res.status(200).send('/assets/generatedVoice.mp3');
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      message: 'Error in file operations',
      error: error.message
    });
  }
}