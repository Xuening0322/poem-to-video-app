import { ElevenLabsClient } from "elevenlabs";
import path from "path";
import fs from "fs/promises";
import { Storage } from '@google-cloud/storage';

const storage = process.env.NODE_ENV === 'production'
  ? new Storage()
  : new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    credentials: {
      client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }
  });

const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET);

async function uploadToGCP(filePath, gcsFilename) {
  try {
    console.log('Starting upload for file:', gcsFilename);

    await bucket.upload(filePath, {
      destination: gcsFilename,
      metadata: {
        contentType: 'audio/mpeg'
      }
    });

    const publicUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_BUCKET}/${encodeURIComponent(gcsFilename)}`;
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

  const assetsDir = path.join(process.cwd(), 'public/assets');

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
      
      if (process.env.NODE_ENV === 'production') {
        // In production, return the GCS public URL directly
        res.status(200).send(publicUrl);
      } else {
        // In development, return the local URL directly
        res.status(200).send('/assets/generatedVoice.mp3');
      }
    
    } catch (uploadError) {
      console.error('GCS upload failed:', uploadError);
      
      if (process.env.NODE_ENV === 'production') {
        // In production, if GCS upload fails, return an error
        throw uploadError;
      } else {
        // In development, fall back to local URL
        res.status(200).send('/assets/generatedVoice.mp3');
      }
    }

  } catch (error) {
    console.error('Error:', error);

    // Cleanup assets directory on error
    try {
      await fs.rm(assetsDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    return res.status(500).json({
      message: 'Error in file operations',
      error: error.message
    });
  }
}