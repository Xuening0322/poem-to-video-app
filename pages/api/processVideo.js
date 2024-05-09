const fs = require('fs');
const fsp = fs.promises;
const axios = require("axios");
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);


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

async function downloadVoice(url) {
    const voicePath = path.join(__dirname, '../../../../public/assets', 'generatedVoice.mp3');
    return (url, voicePath);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const { videoUrl, musicUrl, voiceUrl } = req.body;

        const [videoPath, musicPath, voicePath] = await Promise.all([
            downloadFile(videoUrl, path.join(__dirname, '../../../../public/assets', 'downloadedVideo.mp4')),
            downloadFile(musicUrl, path.join(__dirname, '../../../../public/assets', 'downloadedMusic.mp3')),
            downloadVoice(voiceUrl),
        ]);

        const outputPath = await processVideo(videoPath, musicPath, voicePath);
        console.log("output path: ", outputPath);

        const publicDirectory = path.join(__dirname, '../../../../public');
        const relativeOutputPath = "/" + path.relative(publicDirectory, outputPath);
        console.log("final output path: ", relativeOutputPath);
        res.status(200).json({ url: relativeOutputPath });
    } catch (error) {
        console.error('Error in processing:', error);
        res.status(500).json({ error: 'Failed to process video' });
    }
}


async function processVideo(videoPath, musicPath, voicePath) {
    const [videoDuration, musicDuration, voiceDuration] = await Promise.all([
        getMediaDuration(videoPath),
        getMediaDuration(musicPath),
        getMediaDuration(voicePath)
    ]);

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
