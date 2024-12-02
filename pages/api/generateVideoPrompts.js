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
    + "The two prompts should describe scenes that are very visually similar, ensuring smooth transitions between them. "
    + `Please generate only one sentence for each prompt, clearly labeled with 'Start Prompt:' and 'End Prompt:' to delineate them. Include as many literals ('${literals}') as possible. `
    + "Do not include any humans, humanoid figures, or actions implying human presence (e.g., traveling, interacting, observing). Avoid human-related elements like clothing, tools, or body parts. Focus entirely on objects, landscapes, animals, or abstract non-human visuals. "
    + "Do not use words like 'traveler,' 'wanderer,' 'observer,' or any terms that refer to a person or their perspective. "
    + "Avoid including depictions of text, symbols, or overly abstract elements. "
    + "Ensure visuals for both prompts are timed to match the poem's narration precisely. "
    + `Start Prompt: One sentence. Begin with a scene that includes all the poem's literal elements, evoking the broader themes of '${themes}' and the emotion of '${emotions}'. This scene should set the narrative in motion. `
    + `End Prompt: One sentence. Conclude the narrative with a scene that is visually similar to the start prompt, reflecting a transformation or resolution while maintaining continuity with the initial scene.`
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
