// pages/api/analyzePoem.js

const axios = require("axios");

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { poem, bpm } = req.body;

  const formattedPoem = poem.replace("\\n", "\n");
  const prompt = `Input Poem: ${formattedPoem}\n\nTask:
  - Summarize the Poem: Provide a concise summary, capturing its core essence and themes in no more than 100 words.
  - Identify Key Themes and Emotions: Analyze the summarized poem to identify its predominant themes (like love, nature, conflict) and emotions (such as joy, sadness, hope).
  - Literal Analysis: Examine and note the literal elements present in the poem. This includes direct references, imagery, and descriptions that contribute to the poem's surface-level meaning.
  - Translate to Musical Terms: Suggest appropriate musical genres, instruments, and elements (like tempo, key, rhythm patterns) that could embody the identified themes, emotions, and literal elements.
  Finally, provide a single sentence prompt for music generation LLMs like MusicLM and MusicGen, summarizing the core essence, themes, emotions, and suggesting musical genres, instruments, tempo, key, and rhythm patterns based on the poem's analysis. Please specify the bpm as the provided one: ${bpm}
  
  Please display the format like 'Themes:', 'Literals:', 'Emotions:', 'Musical Terms:', and 'Prompt:'`;

  try {
      const response = await axios.post('https://api.openai.com/v1/engines/gpt-3.5-turbo-instruct/completions', {
          prompt: prompt,
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

      const analysis = response.data.choices[0].text.trim();
      res.status(200).json({ analysis });
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
