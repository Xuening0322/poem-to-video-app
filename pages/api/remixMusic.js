const Replicate = require("replicate");

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const replicate = new Replicate();
    const { prompt, musicUrl } = req.body;

    console.log("Remixing with prompt and music:", prompt, musicUrl);

    const input = {
        top_k: 250,
        top_p: 0,
        prompt: prompt,
        music_input: musicUrl,
        temperature: 1,
        model_version: "stereo-chord",
        output_format: "mp3",
        large_chord_voca: false,
        chroma_coefficient: 1,
        return_instrumental: false,
        multi_band_diffusion: false,
        normalization_strategy: "loudness",
        classifier_free_guidance: 3
    };

    try {
        const output = await replicate.run(
            "sakemin/musicgen-remixer:0b769f28e399c7c30e4f2360691b9b11c294183e9ab2fd9f3398127b556c86d7",
            { input }
        );

        console.log("Remix generation successful:", output);
        res.status(200).json({ success: true, url: output });
    } catch (error) {
        console.error("Error remixing music:", error);
        res.status(500).json({
            error: "Error remixing music: " + error.message,
            input: input
        });
    }
}