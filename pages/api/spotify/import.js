// pages/api/spotify/import.js
import SpotifyWebApi from 'spotify-web-api-node';
import { exec } from 'child_process';
import { Storage } from '@google-cloud/storage';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

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

async function findMp3File(directory) {
  try {
    const files = await fs.readdir(directory);
    const mp3File = files.find(file => file.endsWith('.mp3'));
    return mp3File ? path.join(directory, mp3File) : null;
  } catch (error) {
    console.error('Error finding MP3 file:', error);
    throw error;
  }
}

async function uploadToGCP(filePath, filename) {
  try {
    console.log('Starting upload for file:', filename);
    const fileBuffer = await fs.readFile(filePath);
    const blob = bucket.file(filename);
    
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: 'audio/mpeg'
      }
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        console.error('Stream error:', err);
        reject(err);
      });

      blobStream.on('finish', async () => {
        try {
          const publicUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_BUCKET}/${encodeURIComponent(filename)}`;
          console.log('File uploaded successfully:', publicUrl);
          resolve(publicUrl);
        } catch (err) {
          console.error('Error getting public URL:', err);
          reject(err);
        }
      });

      console.log('Writing buffer to stream...');
      blobStream.end(fileBuffer);
    });
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
  });

  const downloadsDir = path.join(process.cwd(), 'downloads');

  try {
    // Extract track ID from URL
    const spotifyUrl = req.body.spotifyUrl;
    const trackId = spotifyUrl.split('/track/')[1].split('?')[0];

    // Get access token
    const auth = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(auth.body.access_token);

    // Get track info
    const track = await spotifyApi.getTrack(trackId);

    // Create downloads directory
    await fs.mkdir(downloadsDir, { recursive: true });

    console.log('Downloading track using spotifydl...');
    const downloadCommand = `spotifydl --of "downloads___{itemName}" --sf "{itemName} - {artistName}" ${spotifyUrl}`;
    await execAsync(downloadCommand);

    // Find the downloaded MP3 file
    const mp3FilePath = await findMp3File(downloadsDir);
    if (!mp3FilePath) {
      throw new Error('No MP3 file found in downloads directory');
    }

    // Generate timestamp-based filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `previews/${timestamp}-${trackId}.mp3`;

    // Upload to GCP and get public URL
    const publicUrl = await uploadToGCP(mp3FilePath, filename);

    // Clean up downloads directory
    await fs.rm(downloadsDir, { recursive: true, force: true });

    return res.status(200).json({
      track: track.body,
      previewUrl: publicUrl,
      id: filename,
      createdAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing track:', error);
    
    // Cleanup downloads directory
    try {
      await fs.rm(downloadsDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    return res.status(500).json({
      message: 'Error processing track',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}