const fs = require('fs');
const fsp = fs.promises;
const axios = require("axios");
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
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

async function uploadToGCP(filePath, filename) {
    try {
        console.log('Starting upload for file:', filename);
        const fileBuffer = await fsp.readFile(filePath);
        const blob = bucket.file(filename);

        return new Promise((resolve, reject) => {
            const blobStream = blob.createWriteStream({
                resumable: false,
                metadata: {
                    contentType: 'video/mp4'
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

            blobStream.end(fileBuffer);
        });
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

async function downloadFile(url, outputFilePath) {
    const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream'
    });

    const writer = response.data.pipe(fs.createWriteStream(outputFilePath));
    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(outputFilePath));
        writer.on('error', reject);
    });
}

async function downloadMusic(url) {
    const trimmedPath = path.join(__dirname, '../../../../public/assets', 'trimmed_audio.mp3');
    
    // Check if it's the trimmed audio file
    if (url.includes('trimmed_audio.mp3')) {
        console.log("Trimmed audio detected, using local file");
        if (fs.existsSync(trimmedPath)) {
            return trimmedPath;
        } else {
            throw new Error('Trimmed audio file not found');
        }
    }
    
    // If not trimmed audio, download from URL
    console.log("Downloading music from URL:", url);
    return downloadFile(url, path.join(__dirname, '../../../../public/assets', 'downloadedMusic.mp3'));
}

async function downloadVoice(url) {
    const voicePath = path.join(__dirname, '../../../../public/assets', 'generatedVoice.mp3');
    return (url, voicePath);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const { videoUrl, musicUrl, voiceUrl, metadata } = req.body;

        const [videoPath, musicPath, voicePath] = await Promise.all([
            downloadFile(videoUrl, path.join(__dirname, '../../../../public/assets', 'downloadedVideo.mp4')),
            downloadMusic(musicUrl),
            downloadVoice(voiceUrl),
        ]);

        console.log("Downloaded all files:", videoPath, musicPath, voicePath);

        const finalVideoPath = await processVideo(videoPath, musicPath, voicePath);
        console.log("Video processing completed:", finalVideoPath);

        // Upload to GCP and get public URL
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.mp4`;

        const publicUrl = await uploadToGCP(finalVideoPath, filename);
        console.log("Uploaded to GCP:", publicUrl);

        return res.status(200).json({
            url: publicUrl,
            id: filename,
            title: metadata?.title || 'Untitled',
            style: metadata?.style || 'Standard',
            createdAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in processing:', error);
        res.status(500).json({
            error: 'Failed to process video',
            details: error.message || error.toString()
        });
    }
}


async function processVideo(videoPath, musicPath, voicePath) {
    const [videoDuration, musicDuration, voiceDuration] = await Promise.all([
        getMediaDuration(videoPath),
        getMediaDuration(musicPath),
        getMediaDuration(voicePath)
    ]);

    console.log(videoDuration, musicDuration, voiceDuration);

    const speedFactor = videoDuration / musicDuration;
    const loopsRequired = Math.ceil(voiceDuration / musicDuration);

    const adjustedVideoPath = await adjustVideoSpeed(videoPath, speedFactor);
    const finalVideoPath = await concatenateAndMix(adjustedVideoPath, musicPath, voicePath, loopsRequired, voiceDuration);

    return finalVideoPath;
}

async function getMediaDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) reject(err);
            else resolve(metadata.format.duration);
        });
    });
}

async function adjustVideoSpeed(videoPath, speedFactor) {
    const adjustedVideoPath = path.join(__dirname, '../../../../public/assets', 'adjusted_video.mp4');
    await new Promise((resolve, reject) => {
        ffmpeg(videoPath)
            .outputOptions([
                `-filter:v setpts=${(1 / speedFactor).toFixed(3)}*PTS`,
                '-an' // Disable audio to avoid desynchronization issues
            ])
            .on('end', resolve)
            .on('error', (err) => {
                console.error("Error adjusting video speed:", err);
                reject(err);
            })
            .save(adjustedVideoPath);
    });
    return adjustedVideoPath;
}

async function concatenateAndMix(adjustedVideoPath, musicPath, voicePath, loopsRequired, voiceDuration) {
    const finalVideoPath = path.join(__dirname, '../../../../public/assets', 'final_movie.mp4');

    // Looping the music
    const loopedMusicPath = path.join(__dirname, '../../../../public/assets', 'looped_music.mp3');
    await new Promise((resolve, reject) => {
        ffmpeg(musicPath)
            .inputOptions(['-stream_loop', loopsRequired - 1])  // Loop music to match at least the voice duration
            .audioFilters('volume=0.2')  // Control volume
            .outputOptions(['-t', voiceDuration])  // Set duration to voice length
            .save(loopedMusicPath)
            .on('end', resolve)
            .on('error', reject);
    });

    // Looping the adjusted video
    const loopedVideoPath = path.join(__dirname, '../../../../public/assets', 'looped_video.mp4');
    await new Promise((resolve, reject) => {
        ffmpeg(adjustedVideoPath)
            .inputOptions(['-stream_loop', loopsRequired - 1])  // Loop video to match at least the voice duration
            .outputOptions(['-t', voiceDuration])  // Set duration to voice length
            .save(loopedVideoPath)
            .on('end', resolve)
            .on('error', reject);
    });

    // Mixing looped video, looped music, and voice into the final video
    await new Promise((resolve, reject) => {
        ffmpeg()
            .input(loopedVideoPath)
            .input(loopedMusicPath)
            .input(voicePath)
            .complexFilter([
                '[1:a][2:a]amix=inputs=2:duration=first[audio]'  // Mix music and voice
            ])
            .outputOptions([
                '-map 0:v',  // Looped video
                '-map [audio]',  // Mixed audio
                '-c:v libx264',  // Video codec
                '-c:a aac',  // Audio codec
                '-strict experimental',
                '-shortest'  // End output based on the shortest input stream
            ])
            .on('end', () => resolve(finalVideoPath))
            .on('error', (err) => {
                console.error("ffmpeg error during mixing:", err);
                reject(err);
            })
            .save(finalVideoPath);
    });

    return finalVideoPath;
}
