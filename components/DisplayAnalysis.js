// components/DisplayAnalysis.js
import React, { useState, useEffect } from 'react';

const DisplayAnalysis = ({ analysis, duration, poemText, bpm, videoStyle }) => {
  const initialAnalysis = analysis
    .split('\n')
    .reduce((acc, line) => {
      const [key, value] = line.split(':').map((str) => str.trim());
      acc[key.toLowerCase().replace(/ /g, '')] = value;
      return acc;
    }, {});

  // State for each category
  const [themes, setThemes] = useState('');
  const [literals, setLiterals] = useState('');
  const [emotions, setEmotions] = useState('');
  const [musicalTerms, setMusicalTerms] = useState('');
  const [prompt, setPrompt] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [videoPrompts, setVideoPrompts] = useState([]);  // State to store video prompts
  const [startPrompt, setStartPrompt] = useState('');
  const [endPrompt, setEndPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState('');  // State to store the generated video URL
  const [voiceUrl, setVoiceUrl] = useState('');
  const [movieUrl, setMovieUrl] = useState('');



  // Effect hook to update text area values when `analysis` prop changes
  useEffect(() => {
    if (analysis) {
      const parsedAnalysis = analysis
        .split('\n')
        .reduce((acc, line) => {
          const [key, value] = line.split(':').map((str) => str.trim());
          acc[key.toLowerCase().replace(/ /g, '')] = value;
          return acc;
        }, {});
      setThemes(parsedAnalysis['themes']);
      setLiterals(parsedAnalysis['literals']);
      setEmotions(parsedAnalysis['emotions']);
      setMusicalTerms(parsedAnalysis['musicalterms']);
      setPrompt(parsedAnalysis['prompt']);
    }
  }, [analysis]);

  useEffect(() => {
    if (musicUrl) {
      console.log("New Music URL set:", musicUrl);
      // Perform any actions needed when musicUrl changes, e.g., logging, analytics, etc.
    }
  }, [musicUrl]); // Dependency array ensures this runs only when musicUrl changes


  // Helper function to handle changes in the textareas
  const handleChange = (setter) => (event) => {
    setter(event.target.value);
  };

  const handleVideoPromptChange = (index) => (event) => {
    const newVideoPrompts = [...videoPrompts];
    newVideoPrompts[index] = event.target.value;
    setVideoPrompts(newVideoPrompts);
  };


  const generateMusic = async () => {
    const requestBody = {
      prompt: prompt + ` at ${bpm} bpm`,
      duration: duration,
    };

    setMusicUrl(''); // Clear the previous URL while the new one is being fetched

    try {
      const response = await fetch('/api/generateMusic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Generated Music:', result);
      setMusicUrl(result.url);
    } catch (error) {
      console.error('Error generating music:', error);
    }
  };

  const generateVideoPrompts = async () => {
    try {
      const response = await fetch('/api/generateVideoPrompts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          poem: prompt,
          themes: themes,
          literals: literals,
          emotions: emotions
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const extractedPrompts = result.prompts.map(prompt => {
        const separatorIndex = prompt.indexOf(':');
        return separatorIndex !== -1 ? prompt.substring(separatorIndex + 1).trim() : '';
      });

      setVideoPrompts(extractedPrompts); // Update state with cleaned prompts
      console.log(extractedPrompts);
    } catch (error) {
      console.error('Error generating video prompts:', error);
    }
  };

  const generateVideo = async () => {
    const requestBody = {
      start_prompt: videoPrompts[0] + ` in a ${videoStyle} style`,
      end_prompt: videoPrompts[1] + ` in a ${videoStyle} style`
    };

    try {
      const response = await fetch('/api/generateVideo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setVideoUrl(result.video_url);
      console.log('Generated Video:', result);
    } catch (error) {
      console.error('Error generating video:', error);
    }
  };

  const generateVoice = async () => {
    const requestBody = {
      poem: poemText
    };

    try {
      const response = await fetch('/api/generateVoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const audioUrl = await response.text();
      setVoiceUrl(audioUrl);

    } catch (error) {
      console.error('Error generating voice:', error);
    }
  };

  const generateMovie = async () => {
    if (!videoUrl || !voiceUrl || !musicUrl) {
      alert('Please generate all necessary files (video, voice, and music) first.');
      return;
    }
    const requestBody = {
      videoUrl: videoUrl,
      musicUrl: musicUrl,
      voiceUrl: voiceUrl
    };
  
    try {
      const response = await fetch('/api/processVideo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log("New movie generated: ", result.url);
      setMovieUrl(result.url);
    } catch (error) {
      console.error('Error generating movie:', error);
    }
  };  


  return (
    <div className="display-analysis">
      <h3>Poem Analysis</h3>
      <label>Themes:</label>
      <textarea value={themes} onChange={handleChange(setThemes)} rows="2" />
      <label>Literals:</label>
      <textarea value={literals} onChange={handleChange(setLiterals)} rows="2" />
      <label>Emotions:</label>
      <textarea value={emotions} onChange={handleChange(setEmotions)} rows="2" />
      <label>Musical Terms:</label>
      <textarea value={musicalTerms} onChange={handleChange(setMusicalTerms)} rows="2" />
      <label>Prompt:</label>
      <textarea value={prompt} onChange={handleChange(setPrompt)} rows="4" />
      <h3>Music Generation</h3>
      <button onClick={generateMusic}>Generate Music</button>
      {musicUrl && (
        <audio controls>
          <source src={musicUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}
      <h3>Voice Generation</h3>
      <button onClick={generateVoice}>Generate Voice</button>
      {voiceUrl && (
        <audio controls>
          <source src={voiceUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}
      <h3>Video Generation</h3>
      <button onClick={generateVideoPrompts}>Generate Video Prompts</button>
      <label style={{ marginTop: '30px' }}>Start Video Prompt:</label>
      <textarea value={videoPrompts[0]} onChange={handleVideoPromptChange(0)} rows="3" />
      <label>End Video Prompt:</label>
      <textarea value={videoPrompts[1]} onChange={handleVideoPromptChange(1)} rows="3" />
      <button onClick={generateVideo}>Generate Video</button>
      {videoUrl && (
        <video controls>
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
      <h3>Music Video Generation</h3>
      <button onClick={generateMovie}>Generate Music Video</button>
      {movieUrl && (
        <video controls>
          <source src={movieUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
    </div>
  );
}
export default DisplayAnalysis;
