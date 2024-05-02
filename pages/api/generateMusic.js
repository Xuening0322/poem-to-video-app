// pages/api/generateMusic.js

const Replicate = require("replicate");

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const replicate = new Replicate();

        const { prompt, duration } = req.body;
        const duration_int = parseInt(duration);
        console.log("prompt and duration: ", prompt, duration_int);
        const model_version = "stereo-large";
        const output_format = "mp3";
        const normalization_strategy = "peak";

        const input = {
            prompt,
            duration: duration_int,
            model_version,
            output_format,
            normalization_strategy
        };

        try {
            const output = await replicate.run("meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb", { input });
            console.log("Music generation successful:", output);

            res.status(200).json({ success: true, url: output });
        } catch (error) {
            console.error("Error generating music:", error);
            res.status(500).json({ error: "Error generating music: " + error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}