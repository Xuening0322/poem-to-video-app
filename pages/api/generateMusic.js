// pages/api/generateMusic.js

const Replicate = require("replicate");

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const replicate = new Replicate();

        const { prompt, duration } = req.body;
        
        // Ensure duration is properly parsed and validated
        const duration_int = Math.min(Math.max(parseInt(duration) || 30, 5), 30);
        
        console.log("Validated prompt and duration: ", prompt, duration_int);
        
        const input = {
            prompt,
            duration: duration_int,
            model_version: "stereo-large",
            output_format: "mp3",
            normalization_strategy: "peak"
        };

        try {
            const output = await replicate.run(
                "meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
                { input }
            );
            
            console.log("Music generation successful:", output);

            res.status(200).json({ success: true, url: output });
        } catch (error) {
            console.error("Error generating music:", error);
            res.status(500).json({ 
                error: "Error generating music: " + error.message,
                input: input // Include input in error response for debugging
            });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}