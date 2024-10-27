import { Storage } from '@google-cloud/storage';
import fetch from 'node-fetch';

const storage = new Storage();
const bucket = storage.bucket('poem-to-video');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  
    try {
      const { videoUrl, metadata } = req.body;
  
      if (!videoUrl) {
        return res.status(400).json({ message: 'Video URL is required' });
      }

      // Format the date for the filename
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      
      // Generate a unique filename with proper structure
      const filename = `videos/${timestamp}-${Math.random().toString(36).substring(7)}.mp4`;
  
      console.log('Downloading video from:', videoUrl);
      const response = await fetch(videoUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.statusText}`);
      }
      
      const buffer = await response.buffer();
  
      const file = bucket.file(filename);
      const stream = file.createWriteStream({
        metadata: {
          contentType: 'video/mp4',
          metadata: {
            title: metadata?.title || 'Untitled',
            style: metadata?.style || 'Standard',
            createdAt: now.toISOString()
          },
          cacheControl: 'public, max-age=31536000',
        }
      });
  
      return new Promise((resolve, reject) => {
        stream.on('finish', async () => {
          try {
            // Make the file public
            await file.makePublic();
            
            const publicUrl = `https://storage.googleapis.com/poem-to-video/${filename}`;
            console.log('Upload successful:', publicUrl);
            
            res.status(200).json({ 
              url: publicUrl,
              id: filename,
              title: metadata?.title || 'Untitled',
              style: metadata?.style || 'Standard',
              createdAt: now.toISOString()
            });
            resolve();
          } catch (err) {
            console.error('Error making file public:', err);
            res.status(500).json({ 
              message: 'Error making file public', 
              error: err.message,
              stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            });
            reject(err);
          }
        });
  
        stream.on('error', (err) => {
          console.error('Upload stream error:', err);
          res.status(500).json({ 
            message: 'Error uploading to storage', 
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
          });
          reject(err);
        });
  
        stream.end(buffer);
      });
    } catch (error) {
      console.error('Error processing video:', error);
      res.status(500).json({ 
        message: 'Error processing video', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
}