// components/DisplayAnalysis.js
import React, { useState, useEffect } from 'react';
import AudioTrimmer from './AudioTrimmer';

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
    const [videoKey, setVideoKey] = useState(0);
    const [movieKey, setMovieKey] = useState(0);
    const [audioKey, setAudioKey] = useState(0);
    const [voiceKey, setVoiceKey] = useState(0);

    const [spotifyUrl, setSpotifyUrl] = useState('');
    const [spotifyTrack, setSpotifyTrack] = useState(null);
    const [musicAnalysis, setMusicAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [musicSource, setMusicSource] = useState(null);
    const [showSpotifyInput, setShowSpotifyInput] = useState(false);
    const [showAudioTrimmer, setShowAudioTrimmer] = useState(false);
    const [realBlobUrl, setRealBlobUrl] = useState('');
    const [voiceDuration, setVoiceDuration] = useState(0);

    const [isVoiceLoading, setIsVoiceLoading] = useState(false);
    const [isMusicLoading, setIsMusicLoading] = useState(false);
    const [isVideoLoading, setIsVideoLoading] = useState(false);
    const [isMovieLoading, setIsMovieLoading] = useState(false);
    const [isPromptsLoading, setIsPromptsLoading] = useState(false);

    useEffect(() => {
        // Reset all relevant states when a new analysis comes in
        setMusicUrl('');
        setVideoUrl('');
        setVoiceUrl('');
        setMovieUrl('');
        setVideoPrompts([]);
        setSpotifyUrl('');
        setSpotifyTrack(null);
        setMusicAnalysis(null);
        setError(null);
        setMusicSource(null);
        setShowSpotifyInput(false);
        setVideoKey(prevKey => prevKey + 1);
        setMovieKey(prevKey => prevKey + 1);
        setAudioKey(prevKey => prevKey + 1);

        // Only update the analysis-related states if there's new analysis data
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
        setIsMusicLoading(true);
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
            setAudioKey(prevKey => prevKey + 1); // Increment audio key when new music is generated
        } catch (error) {
            console.error('Error generating music:', error);
        } finally {
            setIsMusicLoading(false);
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
            setAudioKey(prevKey => prevKey + 1); // Increment audio key when new track is imported

        } catch (error) {
            setError(error.message);
            console.error('Error importing Spotify track:', error);
        } finally {
            setIsLoading(false);
        }
    };


    const generateVideo = async () => {
        setIsVideoLoading(true);
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
            setVideoKey(prevKey => prevKey + 1); // Increment the key when new video is generated
            console.log('Generated Video:', result);
        } catch (error) {
            console.error('Error generating video:', error);
        } finally {
            setIsVideoLoading(false);
        }
    };

    const generateVideoPrompts = async () => {
        setIsPromptsLoading(true);

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
        } finally {
            setIsPromptsLoading(false);
        }
    };

    const generateVoice = async () => {
        setIsVoiceLoading(true);
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
            setVoiceKey(prevKey => prevKey + 1);

            // Get duration of generated voice
            const audio = new Audio(audioUrl);
            audio.addEventListener('loadedmetadata', () => {
                setVoiceDuration(audio.duration);
            });

        } catch (error) {
            console.error('Error generating voice:', error);
        } finally {
            setIsVoiceLoading(false);
        }
    };

    const generateMovie = async () => {
        setIsMovieLoading(true);
        if (!videoUrl || !voiceUrl || !musicUrl) {
            alert('Please generate all necessary files (video, voice, and music) first.');
            return;
        }

        try {
            // Use the real blob URL for uploaded audio, otherwise use the regular musicUrl
            const musicUrlToUse = musicSource === 'uploaded' ? realBlobUrl : musicUrl;

            const requestBody = {
                videoUrl: videoUrl,
                musicUrl: musicUrlToUse,
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

            setMovieUrl(result.url);
            setMovieKey(prevKey => prevKey + 1);

        } catch (error) {
            console.error('Error generating movie:', error);
            alert(`Failed to generate movie: ${error.message}`);
        } finally {
            setIsMovieLoading(false);
        }
    };

    const handleSpotifyClick = () => {
        setShowSpotifyInput(!showSpotifyInput);
        // Clear audio trimmer when switching to Spotify
        if (!showSpotifyInput) {
            setShowAudioTrimmer(false);
            setRealBlobUrl('');
            if (musicSource === 'uploaded') {
                setMusicUrl('');
                setMusicSource(null);
                setAudioKey(prevKey => prevKey + 1);
            }
        }
    };

    const handleAudioTrimmerClick = () => {
        setShowAudioTrimmer(!showAudioTrimmer);
        // Clear Spotify when switching to trimmer
        if (!showAudioTrimmer) {
            setShowSpotifyInput(false);
            setSpotifyUrl('');
            setSpotifyTrack(null);
            if (musicSource === 'spotify') {
                setMusicUrl('');
                setMusicSource(null);
                setAudioKey(prevKey => prevKey + 1);
            }
        }
    };

    const handleMusicAction = (action) => {
        if (!voiceUrl) {
            alert('Please generate voice narration first.');
            return;
        }

        switch (action) {
            case 'generate':
                generateMusic();
                break;
            case 'spotify':
                handleSpotifyClick();
                break;
            case 'trimmer':
                handleAudioTrimmerClick();
                break;
        }
    };


    return (
        <div className="display-analysis">
            <h3>🎭 Poem Analysis</h3>
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


            {prompt && (
                <>
                    <h3>🗣 Voice Generation</h3>
                    <button
                        onClick={generateVoice}
                        disabled={isVoiceLoading}
                        className={isVoiceLoading ? 'button-disabled' : ''}
                    >
                        {isVoiceLoading && <span className="loading-spinner" />}
                        {isVoiceLoading ? 'Generating Voice...' : 'Generate Voice Narration'}
                    </button>      {voiceUrl && (
                        <audio
                            key={voiceKey}
                            controls
                        >
                            <source src={voiceUrl} type="audio/mpeg" />
                            Your browser does not support the audio element.
                        </audio>
                    )}
                </>
            )}


            {voiceUrl && (
                <>
                    <h3>🎵 Music Generation</h3>
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <button
                                onClick={() => handleMusicAction('generate')}
                                disabled={isMusicLoading}
                                className={isMusicLoading ? 'button-disabled' : ''}
                            >
                                {isMusicLoading && <span className="loading-spinner" />}
                                {isMusicLoading ? 'Generating Music...' : 'Generate Music from Prompts above'}
                            </button>
                            <button onClick={() => handleMusicAction('spotify')}>
                                Import from Spotify
                            </button>
                            <button onClick={() => handleMusicAction('trimmer')}>
                                Upload Your Own Audio
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

                        {showAudioTrimmer && (
                            <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h4 style={{ margin: 0 }}>Audio Trimmer</h4>
                                    <button
                                        onClick={() => {
                                            setShowAudioTrimmer(false);
                                            if (musicSource === 'spotify') {
                                                setShowSpotifyInput(true);
                                            }
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                                <AudioTrimmer
                                    onSave={(trimmedAudioUrl) => {
                                        setRealBlobUrl(trimmedAudioUrl);
                                        setMusicUrl(trimmedAudioUrl);
                                        setMusicSource('uploaded');
                                        setAudioKey(prevKey => prevKey + 1);
                                        setShowAudioTrimmer(false);
                                    }}
                                    targetDuration={voiceDuration}
                                    initialAudioUrl={musicSource === 'spotify' ? musicUrl : null}
                                />
                            </div>
                        )}

                        {!showAudioTrimmer && musicUrl && (
                            <div style={{ marginTop: '20px' }}>
                                {spotifyTrack && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        marginBottom: '10px'
                                    }}>
                                        <p>Imported: {spotifyTrack.name} - {spotifyTrack.artists[0].name}</p>
                                        <button
                                            onClick={() => {
                                                setShowSpotifyInput(false);
                                                setShowAudioTrimmer(true);
                                            }}
                                            style={{
                                                padding: '4px 8px',
                                                fontSize: '0.9em',
                                                backgroundColor: '#68bcf7',
                                                border: '1px solid #68bcf7',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Want to trim this track?
                                        </button>
                                    </div>
                                )}
                                <audio key={audioKey} controls>
                                    <source src={musicUrl} type="audio/mpeg" />
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        )}

                    </div>

                </>
            )}

            {musicUrl && (
                <>
                    <h3>🎬 Video Generation</h3>
                    <button
                        onClick={generateVideoPrompts}
                        disabled={isPromptsLoading}
                        className={isPromptsLoading ? 'button-disabled' : ''}
                    >
                        {isPromptsLoading && <span className="loading-spinner" />}
                        {isPromptsLoading ? 'Generating Prompts...' : 'Generate Video Prompts'}
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
                        disabled={isVideoLoading || !videoPrompts[0] || !videoPrompts[1]}
                        className={isVideoLoading ? 'button-disabled' : ''}
                    >
                        {isVideoLoading && <span className="loading-spinner" />}
                        {isVideoLoading ? 'Generating Video...' : 'Generate Video'}
                    </button>

                    {videoUrl && (
                        <div style={{ marginTop: '20px' }}>
                            <video
                                key={videoKey}
                                controls
                            >
                                <source src={videoUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    )}

                </>
            )}

            {videoUrl && (
                <>
                    <h3>📽 Music Video Generation</h3>
                    <button
                        onClick={generateMovie}
                        disabled={isMovieLoading}
                        className={isMovieLoading ? 'button-disabled' : ''}
                    >
                        {isMovieLoading && <span className="loading-spinner" />}
                        {isMovieLoading ? 'Generating Music Video...' : 'Generate Music Video'}
                    </button>      {movieUrl && (
                        <div style={{ marginTop: '20px' }}>
                            <video
                                key={movieKey}
                                controls
                            >
                                <source src={movieUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default DisplayAnalysis;