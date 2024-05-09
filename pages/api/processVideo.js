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
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}


function downloadVideo(url) {
    const videoPath = path.join(__dirname, '../../../../public/assets', 'downloadedVideo.mp4');
    return downloadFile(url, videoPath)
        .then(() => videoPath)
        .catch(error => {
            console.error('Failed to download video:', error);
            throw error;  // Re-throw the error to handle it in the calling context
        });
}

function downloadMusic(url) {
    const musicPath = path.join(__dirname, '../../../../public/assets', 'downloadedMusic.mp3');
    return downloadFile(url, musicPath)
        .then(() => musicPath)
        .catch(error => {
            console.error('Failed to download music:', error);
            throw error;  // Re-throw the error to handle it in the calling context
        });
}

function downloadVoice(url) {
    const voicePath = path.join(__dirname, '../../../../public', url);
    console.log(voicePath);
    return voicePath;
}

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const { videoUrl, musicUrl, voiceUrl } = req.body;

        // Handle downloads concurrently (if needed)
        Promise.all([
            downloadVideo(videoUrl),
            downloadMusic(musicUrl),
            downloadVoice(voiceUrl),
        ])
        .then(([videoPath, musicPath, voicePath]) => {
            console.log("Files prepared for processing:", videoPath, musicPath, voicePath);
            return processVideo(videoPath, musicPath, voicePath, path.join(process.cwd(), 'public', 'assets', 'finalOutput.mp4'));
        })
        .then(outputPath => {
            console.log("Video processing complete, file available at:", outputPath);
            res.status(200).json({ url: `/assets/finalOutput.mp4` });
        })
        .catch(error => {
            console.error('Error in processing:', error);
            res.status(500).json({ error: 'Failed to process video' });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
}
async function processVideo(videoPath, musicPath, voicePath, outputPath) {
    try {
        // Load the voice clip to get its duration
        const voiceInfo = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(voicePath, (err, metadata) => {
                if (err) reject(err);
                else resolve(metadata);
            });
        });
        const voiceDuration = voiceInfo.format.duration;

        // Load the video clip to get its duration
        const videoInfo = await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(videoPath, (err, metadata) => {
                if (err) reject(err);
                else resolve(metadata);
            });
        });
        const videoDuration = videoInfo.format.duration;

        // Calculate the number of times the video needs to be looped to cover the voice duration
        const loopsRequired = Math.ceil(voiceDuration / videoDuration);

        // Input options to loop the video the required number of times
        const inputOptions = [];
        for (let i = 0; i < loopsRequired; i++) {
            inputOptions.push('-stream_loop', '1');
        }

        // Use fluent-ffmpeg to process the video
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input(videoPath)
                .inputOptions(inputOptions) // Loop the video the required number of times
                .input(musicPath)
                .input(voicePath)
                .complexFilter([
                    // Fade effects and volume adjustment for music
                    {
                        filter: 'afade',
                        options: { t: 'in', ss: 0, d: 3 },
                        inputs: '1:a',
                        outputs: 'fadedIn'
                    },
                    {
                        filter: 'afade',
                        options: { t: 'out', st: 3, d: 3 },
                        inputs: 'fadedIn',
                        outputs: 'fadedOut'
                    },
                    { filter: 'volume', options: '0.2', inputs: 'fadedOut', outputs: 'musicWithVolume' },
                    
                    // Mixing audio tracks
                    // Use the 'shortest' duration setting to ensure the mixed output matches the duration of the shortest input track
                    { filter: 'amix', options: { inputs: 2, duration: 'shortest' }, inputs: ['musicWithVolume', '2:a'], outputs: 'mixed' },

                    // Ensuring video covers the mixed audio duration
                    {
                        filter: 'setpts',
                        options: 'PTS-STARTPTS',
                        inputs: '0:v',
                        outputs: 'videoLooped'
                    }
                ])
                .outputOptions([
                    '-map', '[videoLooped]',
                    '-map', '[mixed]',
                    '-shortest'  // Ensure the output duration matches the shortest of the audio or video streams
                ])
                .output(outputPath)
                .on('end', () => {
                    console.log("ffmpeg process finished. Output file created at:", outputPath);
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error("Error during ffmpeg processing:", err);
                    reject(err);
                })
                .run();
        });
        
        return outputPath;
    } catch (error) {
        console.error("Error processing video:", error);
        throw error;
    }
}
