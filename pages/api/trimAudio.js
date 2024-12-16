const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const fs = require('fs');
const { IncomingForm } = require('formidable');
const path = require('path');
const { Storage } = require('@google-cloud/storage');

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

async function uploadToGCP(filePath, gcsFilename) {
  try {
    console.log('Starting upload to GCP:', gcsFilename);
    
    await bucket.upload(filePath, {
      destination: gcsFilename,
      metadata: {
        contentType: 'audio/mpeg'
      }
    });

    const publicUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_BUCKET}/${encodeURIComponent(gcsFilename)}`;
    console.log('File uploaded successfully to GCP:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('GCP upload error:', error);
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
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

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
    const outputFilename = `trimmed_${timestamp}.mp3`;
    outputFilePath = path.join(assetsDir, outputFilename);

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
      try {
        const gcsFilename = `trimmed-audio/${path.basename(outputFilename)}`;
        fileUrl = await uploadToGCP(outputFilePath, gcsFilename);
      } catch (uploadError) {
        console.error('Failed to upload to GCP:', uploadError);
        throw uploadError;
      }
    } else {
      fileUrl = `/assets/${outputFilename}`;
    }

    res.status(200).send(fileUrl);

  } catch (error) {
    console.error('Error processing audio:', error);
    
    res.status(500).json({ 
      error: 'Failed to process audio',
      details: error.message || error.toString()
    });
  }
}