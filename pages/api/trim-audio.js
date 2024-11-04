import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import formidable from 'formidable';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Configure API to handle file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to save uploaded file
const saveFile = async (file) => {
  const data = fs.readFileSync(file.filepath);
  const timestamp = Date.now();
  const fileName = `audio-${timestamp}${path.extname(file.originalFilename)}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, data);
  fs.unlinkSync(file.filepath);
  return filePath;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const form = new formidable.IncomingForm();
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Save uploaded file
    const filePath = await saveFile(files.audio);
    const start = parseFloat(fields.start);
    const end = parseFloat(fields.end);
    
    // Generate output filename
    const outputFileName = `trimmed-${Date.now()}.mp3`;
    const outputDir = path.join(process.cwd(), 'public', 'uploads');
    const outputPath = path.join(outputDir, outputFileName);

    // Trim audio using ffmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .setStartTime(start)
        .setDuration(end - start)
        .output(outputPath)
        .on('end', () => {
          // Clean up original file
          fs.unlinkSync(filePath);
          resolve();
        })
        .on('error', (err) => {
          // Clean up original file even on error
          fs.unlinkSync(filePath);
          reject(err);
        })
        .run();
    });

    // Return the URL to the trimmed audio
    const publicUrl = `/uploads/${outputFileName}`;
    res.status(200).json({ url: publicUrl });
  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({ error: 'Error processing audio file' });
  }
}