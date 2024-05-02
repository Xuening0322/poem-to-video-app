// pages/api/generateVideo.js

const Replicate = require("replicate");

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const replicate = new Replicate();
        const { start_prompt, end_prompt } = req.body;

        const input = {
            width: 512,
            height: 512,
            prompt_end: end_prompt,
            prompt_start: start_prompt,
            gif_ping_pong: true,
            output_format: "mp4",
            guidance_scale: 7.5,
            prompt_strength: 0.9,
            film_interpolation: true,
            intermediate_output: true,
            num_inference_steps: 50,
            num_animation_frames: 25,
            gif_frames_per_second: 20,
            num_interpolation_steps: 5
        };

        try {
            const video_url = await replicate.run(
                "andreasjansson/stable-diffusion-animation:a0cd8005509b772461dd2a4dc58d304bac1d150d93fa35fdc80dc5835f766d4d",
                { input }
            );
            console.log("Video generation successful:", video_url);

            res.status(200).json({ video_url });
        } catch (error) {
            console.error("Error generating video:", error);
            res.status(500).json({ error: "Error generating video: " + error.message });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}