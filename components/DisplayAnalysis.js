// components/DisplayAnalysis.js
import React, { useState, useEffect } from 'react';

const DisplayAnalysis = ({ analysis, duration, poemText, bpm, videoStyle }) => {

  const [themes, setThemes] = useState('');
  const [literals, setLiterals] = useState('');
  const [emotions, setEmotions] = useState('');
  const [musicalTerms, setMusicalTerms] = useState('');
  const [prompt, setPrompt] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [videoPrompts, setVideoPrompts] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [voiceUrl, setVoiceUrl] = useState('');
  const [movieUrl, setMovieUrl] = useState('');

  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [spotifyTrack, setSpotifyTrack] = useState(null);
  const [musicAnalysis, setMusicAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [musicSource, setMusicSource] = useState(null);
  const [showSpotifyInput, setShowSpotifyInput] = useState(false);

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
    }
  }, [musicUrl]);


  const handleChange = (setter) => (event) => {
    setter(event.target.value);
  };

  const handleVideoPromptChange = (index) => (event) => {
    const newVideoPrompts = [...videoPrompts];
    newVideoPrompts[index] = event.target.value;
    setVideoPrompts(newVideoPrompts);
  };

  const generateMusic = async () => {
    setMusicSource('generated');
    setSpotifyTrack(null);
    setMusicAnalysis(null);

    const requestBody = {
      prompt: prompt + ` at ${bpm} bpm`,
      duration: duration,
    };

    setMusicUrl('');

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

  const importSpotifyTrack = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/spotify/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ spotifyUrl })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Check if the track has a preview URL
      if (!result.previewUrl) {
        const trackName = result.track?.name || 'this track';
        const artistName = result.track?.artists?.[0]?.name || 'the artist';

        setError(`Unfortunately, "${trackName}" by ${artistName} doesn't have a preview available. This happens with some Spotify tracks. Please try another track.`);
        setSpotifyUrl(''); // Clear the input
        setSpotifyTrack(null);
        return;
      }

      setSpotifyTrack(result.track);
      setMusicUrl(result.previewUrl);
      setMusicSource('spotify');

      // Analyze the imported music
      await analyzeMusicFeatures(result.track.id);
    } catch (error) {
      setError(error.message);
      console.error('Error importing Spotify track:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeMusicFeatures = async (trackId) => {
    try {
      const response = await fetch('/api/spotify/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trackId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const analysis = await response.json();
      setMusicAnalysis(analysis);
    } catch (error) {
      setError('Failed to analyze music features');
      console.error('Error analyzing music:', error);
    }
  };

  const generateVideo = async () => {
    const requestBody = {
      // Ensure we're using the current values from videoPrompts
      start_prompt: (videoPrompts[0] || '') + ` in a ${videoStyle} style`,
      end_prompt: (videoPrompts[1] || '') + ` in a ${videoStyle} style`
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

      // Initialize videoPrompts with both start and end prompts
      setVideoPrompts(extractedPrompts);
      console.log(extractedPrompts);
    } catch (error) {
      console.error('Error generating video prompts:', error);
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

    try {
      // Create request body with music source information
      const requestBody = {
        videoUrl: videoUrl,
        musicUrl: musicUrl,
        voiceUrl: voiceUrl,
        metadata: {
          title: prompt?.substring(0, 50) + '...' || 'Untitled',
          style: videoStyle || 'Standard',
          createdAt: new Date().toISOString(),
          musicSource: musicSource,
          ...(spotifyTrack && {
            musicInfo: {
              trackName: spotifyTrack.name,
              artist: spotifyTrack.artists[0].name,
              spotifyUrl: spotifyUrl
            }
          })
        }
      };

      // Process video
      const response = await fetch('/api/processVideo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process video');
      }

      const result = await response.json();
      console.log('Video processed:', result);

      // Make sure we have the full URL
      const fullVideoUrl = result.url.startsWith('http')
        ? result.url
        : `${window.location.origin}${result.url}`;

      // Save to gallery with updated metadata
      const saveResponse = await fetch('/api/saveVideo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoUrl: fullVideoUrl,
          metadata: requestBody.metadata // Use the same metadata from the process request
        })
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.message || 'Failed to save video to gallery');
      }

      const savedVideo = await saveResponse.json();
      setMovieUrl(savedVideo.url);

    } catch (error) {
      console.error('Error generating movie:', error);
      alert(`Failed to generate movie: ${error.message}`);
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
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button onClick={generateMusic}>Generate Music from Prompts above</button>
          <button onClick={() => setShowSpotifyInput(!showSpotifyInput)}>
            Import from Spotify
          </button>
        </div>

        {showSpotifyInput && (
          <div style={{ marginTop: '10px' }}>
            <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '5px' }}>
              Please paste a Spotify track URL (e.g., https://open.spotify.com/track/1301WleyT98MSxVHPZCA6M)
            </p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                value={spotifyUrl}
                onChange={handleChange(setSpotifyUrl)}
                placeholder="Paste Spotify track URL here"
                style={{ flex: 1 }}
              />
              <button
                onClick={importSpotifyTrack}
                disabled={isLoading || !spotifyUrl}
              >
                {isLoading ? 'Importing...' : 'Import Track'}
              </button>
            </div>
            {error && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                borderRadius: '4px',
                fontSize: '0.9em'
              }}>
                {error}
              </div>
            )}
          </div>
        )}

        {spotifyTrack && (
          <div style={{ marginTop: '10px' }}>
            <p>Imported: {spotifyTrack.name} - {spotifyTrack.artists[0].name}</p>
          </div>
        )}
      </div>

      {musicUrl && (
        <audio controls>
          <source src={musicUrl} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}

      {musicAnalysis && (
        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          <h4>Music Analysis:</h4>
          <p>Tempo: {musicAnalysis.tempo} BPM</p>
          <p>Energy: {(musicAnalysis.energy * 100).toFixed(1)}%</p>
          <p>Mood: {(musicAnalysis.valence * 100).toFixed(1)}%</p>
          <p>Danceability: {(musicAnalysis.danceability * 100).toFixed(1)}%</p>
          <p>Acousticness: {(musicAnalysis.acousticness * 100).toFixed(1)}%</p>
          <p>Instrumentalness: {(musicAnalysis.instrumentalness * 100).toFixed(1)}%</p>
          <p>Liveness: {(musicAnalysis.liveness * 100).toFixed(1)}%</p>
          <p>Loudness: {musicAnalysis.loudness} dB</p>
          <p>Speechiness: {(musicAnalysis.speechiness * 100).toFixed(1)}%</p>
          <p>Key: {musicAnalysis.key}</p>
          <p>Mode: {musicAnalysis.mode === 1 ? 'Major' : 'Minor'}</p>
        </div>
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
      <button
        onClick={generateVideoPrompts}
        className="generate-button"
      >
        Generate Video Prompts
      </button>

      <div className="video-prompts-container" style={{ marginTop: '20px' }}>
        <div className="prompt-section">
          <label style={{ display: 'block', marginBottom: '5px' }}>Start Video Prompt:</label>
          <textarea
            value={videoPrompts[0] || ''}
            onChange={handleVideoPromptChange(0)}
            rows="3"
          />
        </div>

        <div className="prompt-section">
          <label style={{ display: 'block', marginBottom: '5px' }}>End Video Prompt:</label>
          <textarea
            value={videoPrompts[1] || ''}
            onChange={handleVideoPromptChange(1)}
            rows="3"
          />
        </div>
      </div>

      <button
        onClick={generateVideo}
        disabled={!videoPrompts[0] || !videoPrompts[1]}
        className="generate-button"
        style={{ marginTop: '10px' }}
      >
        Generate Video
      </button>

      {videoUrl && (
        <div style={{ marginTop: '20px' }}>
          <video controls style={{ width: '100%', borderRadius: '4px' }}>
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
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
};

export default DisplayAnalysis;
