const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const { IncomingForm } = require('formidable');
const { Storage } = require('@google-cloud/storage');
const fs = require('fs/promises');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Initialize Google Cloud Storage based on environment
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

async function uploadToGCP(filePath, filename) {
  try {
    console.log('Starting upload for file:', filename);
    const fileBuffer = await fs.readFile(filePath);
    const blob = bucket.file(filename);
    
    return new Promise((resolve, reject) => {
      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: 'audio/mpeg'
        }
      });

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
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const assetsDir = path.join(process.cwd(), 'public/assets');
  let inputFilePath = null;
  let outputFilePath = null;

  try {
    // Create assets directory if it doesn't exist
    await fs.mkdir(assetsDir, { recursive: true });

    const form = new IncomingForm({
      uploadDir: assetsDir,
      keepExtensions: true,
      multiples: true,
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    const startTime = parseFloat(fields.startTime);
    const endTime = parseFloat(fields.endTime);

    if (!audioFile || !audioFile.filepath) {
      throw new Error('No audio file uploaded');
    }

    if (isNaN(startTime) || isNaN(endTime) || startTime < 0 || endTime <= startTime) {
      return res.status(400).json({ error: 'Invalid start or end time' });
    }

    inputFilePath = audioFile.filepath;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFilename = `trimmed-${timestamp}.mp3`;
    outputFilePath = path.join(assetsDir, outputFilename);

    // Process audio with FFmpeg
    await new Promise((resolve, reject) => {
      let ffmpegCommand = ffmpeg(inputFilePath)
        .toFormat('mp3')
        .setStartTime(startTime)
        .duration(endTime - startTime)
        .audioCodec('libmp3lame')
        .audioQuality(2);

      ffmpegCommand
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('Processing: ' + progress.percent + '% done');
        })
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .on('end', () => {
          console.log('FFmpeg processing finished');
          resolve();
        })
        .save(outputFilePath);
    });

    let fileUrl;
    if (process.env.NODE_ENV === 'production') {
      // Upload processed file to GCP in production
      const gcsFilename = `trimmed-audio/${outputFilename}`;
      fileUrl = await uploadToGCP(outputFilePath, gcsFilename);
    } else {
      // Use local path in development
      fileUrl = '/assets/' + outputFilename;
    }

    // Clean up input file
    try {
      if (inputFilePath && fs.existsSync(inputFilePath)) {
        await fs.unlink(inputFilePath);
      }
      
      // In production, also clean up the processed file after upload
      if (process.env.NODE_ENV === 'production' && outputFilePath && fs.existsSync(outputFilePath)) {
        await fs.unlink(outputFilePath);
      }
    } catch (err) {
      console.error('Error cleaning up files:', err);
    }

    return res.status(200).json({
      url: fileUrl,
      filename: outputFilename,
      createdAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing audio:', error);
    
    // Clean up any leftover files on error
    try {
      if (inputFilePath && fs.existsSync(inputFilePath)) {
        await fs.unlink(inputFilePath);
      }
      if (outputFilePath && fs.existsSync(outputFilePath)) {
        await fs.unlink(outputFilePath);
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    return res.status(500).json({ 
      error: 'Failed to process audio',
      details: error.message || error.toString()
    });
  }
}