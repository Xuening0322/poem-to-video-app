// pages/api/generateVideoPrompts.js

const axios = require("axios");

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { poem, themes, literals, emotions } = req.body;

  const combined_prompt = (
    `Given a poem ('${poem}'), `
    + "generate prompts for an image generation model. "
    + "Use descriptive language to ensure all scenes are interconnected, showcasing a clear transition that aligns with the image generation model's requirements for creating transition videos. "
    + `Please generate only one sentence for each prompt, clearly labeled with 'Start Prompt:' and 'End Prompt:' to delineate them. Include as many literals ('${literals}') as possible, but don't include human or people related literals. `
    + "Ensure visuals for both prompts are timed to match the poem's narration precisely. "
    + `Start Prompt: One sentence. Begin with a scene that includes all the poem's literal elements, evoking the broader themes of '${themes}' and the emotion of '${emotions}'. This scene should set the narrative in motion. `
    + `End Prompt: One sentence. Conclude the narrative with a scene that reflects a transformation or resolution, including all the poem's literal elements.`
  );

  try {
      const response = await axios.post('https://api.openai.com/v1/engines/gpt-3.5-turbo-instruct/completions', {
          prompt: combined_prompt,
          max_tokens: 500,
          temperature: 0.7,
          top_p: 1.0,
          frequency_penalty: 0.0,
          presence_penalty: 0.0
      }, {
          headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
          }
      });

      const generated_text = response.data.choices[0].text.trim();
      const ideas = generated_text.split('\n').map(idea => idea.trim()).filter(idea => idea !== '');
      console.log(ideas);
      res.status(200).json({ prompts: ideas });
  } catch (error) {
      if (error.response) {
          console.error("Error data:", error.response.data);
          res.status(error.response.status).json({ message: error.message, details: error.response.data });
      } else if (error.request) {
          console.error("Error request:", error.request);
          res.status(500).json({ message: "No response received from the server." });
      } else {
          console.error("Error message:", error.message);
          res.status(500).json({ message: "An error occurred while setting up the request." });
      }
  }
}
