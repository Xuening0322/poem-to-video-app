const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const fs = require('fs');
const { IncomingForm } = require('formidable');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const assetsDir = path.join(process.cwd(), 'public/assets');
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

    const outputPath = path.join(assetsDir, 'trimmed_audio.mp3');

    await new Promise((resolve, reject) => {
      let ffmpegCommand = ffmpeg(audioFile.filepath)
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
        .save(outputPath);
    });

    try {
      fs.unlinkSync(audioFile.filepath);
    } catch (err) {
      console.error('Error cleaning up input file:', err);
    }

    const fileUrl = '/assets/trimmed_audio.mp3';
    res.status(200).json({ url: fileUrl });

  } catch (error) {
    console.error('Error handling upload:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process audio',
      details: error.toString()
    });
  }
}