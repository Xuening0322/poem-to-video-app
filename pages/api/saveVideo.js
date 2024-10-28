import { Storage } from '@google-cloud/storage';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

const storage = new Storage({
  keyFilename: path.join(process.cwd(), 'gcp-key.json')
});
const bucket = storage.bucket('poem-to-video');

async function uploadFileToBucket(buffer, filename) {
  try {
    console.log('Starting upload for file:', filename);
    const blob = bucket.file(filename);
    
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: 'video/mp4'
      }
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        console.error('Stream error:', err);
        reject(err);
      });

      blobStream.on('finish', async () => {
        try {
          // Generate a public URL
          const publicUrl = `https://storage.googleapis.com/poem-to-video/${encodeURIComponent(filename)}`;
          console.log('File uploaded successfully:', publicUrl);
          resolve(publicUrl);
        } catch (err) {
          console.error('Error getting public URL:', err);
          reject(err);
        }
      });

      console.log('Writing buffer to stream...');
      blobStream.end(buffer);
    });
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

function parseTimestampFromFilename(filename) {
  const timestampMatch = filename.match(/^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)/);
  if (timestampMatch) {
    // Replace hyphens back to colons and dots for proper ISO format
    const isoTimestamp = timestampMatch[1]
      .replace('T', 'T')
      .replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, ':$1:$2.$3Z');
    return new Date(isoTimestamp);
  }
  return new Date(); // Fallback to current time if no timestamp in filename
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { videoUrl, metadata } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ message: 'Video URL is required' });
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.mp4`;

    console.log('Processing video from:', videoUrl);

    try {
      let fileBuffer;
      
      if (videoUrl.startsWith('/assets')) {
        const localPath = path.join(process.cwd(), 'public', videoUrl);
        console.log('Reading local file from:', localPath);
        fileBuffer = await fs.readFile(localPath);
        console.log('Local file read, size:', fileBuffer.length);
      } else {
        console.log('Fetching remote file from:', videoUrl);
        const response = await fetch(videoUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch video: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
        console.log('Remote file fetched, size:', fileBuffer.length);
      }

      const publicUrl = await uploadFileToBucket(fileBuffer, filename);
      const createdAt = parseTimestampFromFilename(filename);

      return res.status(200).json({
        url: publicUrl,
        id: filename,
        title: metadata?.title || 'Untitled',
        style: metadata?.style || 'Standard',
        createdAt: createdAt.toISOString()
      });

    } catch (uploadError) {
      console.error('Error handling video:', uploadError);
      return res.status(500).json({
        message: 'Error handling video',
        error: uploadError.message,
        stack: process.env.NODE_ENV === 'development' ? uploadError.stack : undefined
      });
    }

  } catch (error) {
    console.error('Error processing video:', error);
    return res.status(500).json({
      message: 'Error processing video',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}