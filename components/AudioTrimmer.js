'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '../styles/AudioTrimmer.module.css';

const AudioTrimmer = ({ onSave, targetDuration, initialAudioUrl }) => {
    const waveSurferRef = useRef(null);
    const containerRef = useRef(null);
    const [audioFile, setAudioFile] = useState(null);
    const [audioURL, setAudioURL] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(targetDuration || 15);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [desiredDuration, setDesiredDuration] = useState(targetDuration || 15);

    useEffect(() => {
        if (initialAudioUrl) {
            const loadInitialAudio = async () => {
                try {
                    const response = await fetch(initialAudioUrl);
                    const blob = await response.blob();
                    const file = new File([blob], 'spotify-audio.mp3', { type: 'audio/mpeg' });
                    const url = URL.createObjectURL(blob);
                    setAudioFile(file);
                    setAudioURL(url);
                } catch (error) {
                    setError('Failed to load audio file');
                }
            };
            loadInitialAudio();
        }
    }, [initialAudioUrl]);

    useEffect(() => {
        const initializeWaveSurfer = async () => {
            const WaveSurfer = (await import('wavesurfer.js')).default;
            const RegionsPlugin = (await import('wavesurfer.js/dist/plugin/wavesurfer.regions.min.js')).default;

            if (typeof window !== 'undefined' && audioURL) {
                if (waveSurferRef.current) {
                    waveSurferRef.current.destroy();
                }

                waveSurferRef.current = WaveSurfer.create({
                    container: containerRef.current,
                    waveColor: '#4F46E5',
                    progressColor: '#818CF8',
                    height: 100,
                    barWidth: 2,
                    responsive: true,
                    normalize: true,
                    backend: 'WebAudio',
                    plugins: [
                        RegionsPlugin.create({
                            dragSelection: {
                                color: 'rgba(255, 0, 0, 0.1)',
                            },
                        }),
                    ]
                });

                waveSurferRef.current.on('ready', () => {
                    const totalDuration = waveSurferRef.current.getDuration();
                    setDuration(totalDuration);
                    
                    const initialEndTime = Math.min(desiredDuration, totalDuration);
                    setEndTime(initialEndTime);

                    waveSurferRef.current.addRegion({
                        start: 0,
                        end: initialEndTime,
                        color: 'rgba(255, 0, 0, 0.1)',
                        drag: true,
                        resize: true,
                    });
                });

                waveSurferRef.current.on('region-updated', (region) => {
                    setStartTime(region.start);
                    setEndTime(region.end);
                });

                waveSurferRef.current.load(audioURL);
            }
        };

        initializeWaveSurfer();

        return () => waveSurferRef.current && waveSurferRef.current.destroy();
    }, [audioURL, desiredDuration]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('audio/')) {
            const url = URL.createObjectURL(file);
            setAudioFile(file);
            setAudioURL(url);
            setError(null);
        } else {
            setError('Please select a valid audio file');
        }
    };

    const handlePlayPause = () => {
        if (waveSurferRef.current) {
            if (!isPlaying) {
                waveSurferRef.current.play();
            } else {
                waveSurferRef.current.pause();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleDurationChange = (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value) && value > 0) {
            setDesiredDuration(value);
            if (waveSurferRef.current) {
                const region = waveSurferRef.current.regions.list[Object.keys(waveSurferRef.current.regions.list)[0]];
                if (region) {
                    const newEnd = Math.min(value, duration);
                    region.end = newEnd;
                    setEndTime(newEnd);
                }
            }
        }
    };

    const handleTrimAndSave = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('audio', audioFile);
            formData.append('startTime', startTime.toString());
            formData.append('endTime', endTime.toString());

            const response = await fetch('/api/trimAudio', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to process audio');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            onSave?.(url);
            
        } catch (error) {
            setError(error.message || 'Error processing audio');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className={styles.audioTrimmer}>
            <div className={styles.infoBox} style={{
                padding: '12px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                marginBottom: '16px'
            }}>
                <p style={{ 
                    fontSize: '0.95em', 
                    marginBottom: '8px',
                    color: '#1e293b',
                    fontWeight: '500'
                }}>
                    Voice Narration Length: {targetDuration.toFixed(1)} seconds
                </p>
                <p style={{ 
                    fontSize: '0.9em',
                    color: '#475569',
                    lineHeight: '1.5'
                }}>
                    Your music will automatically adjust to match the voice narration length. 
                    If longer, it will be cut off; if shorter, it will loop. 
                    For best results, try to trim your music to {targetDuration.toFixed(1)} seconds.
                </p>
            </div>

            {!initialAudioUrl && (
                <div className={styles.fileInputContainer}>
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileChange}
                        className={styles.fileInput}
                    />
                </div>
            )}

            {error && (
                <div className={styles.errorMessage}>
                    {error}
                </div>
            )}

            {audioFile && (
                <>
                    <div className={styles.durationInput}>
                        <label htmlFor="duration">Desired Duration (seconds): </label>
                        <input
                            type="number"
                            id="duration"
                            value={desiredDuration}
                            onChange={handleDurationChange}
                            min="1"
                            step="0.1"
                            className={styles.numberInput}
                        />
                    </div>

                    <div className={styles.fileInfo}>
                        {!initialAudioUrl && <p>Selected file: {audioFile.name} ({audioFile.type})</p>}
                        {duration > 0 && <p>Duration: {duration.toFixed(2)}s</p>}
                    </div>

                    <div ref={containerRef} className={styles.waveContainer} />

                    <div className={styles.buttonGroup}>
                        <button
                            onClick={handlePlayPause}
                            disabled={!waveSurferRef.current}
                            className={`${styles.button} ${styles.buttonPlay}`}
                        >
                            {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        <button
                            onClick={handleTrimAndSave}
                            disabled={isProcessing}
                            className={`${styles.button} ${styles.buttonSave}`}
                        >
                            {isProcessing ? 'Processing...' : 'Use Trimmed Audio'}
                        </button>
                    </div>

                    <div className={styles.trimRange}>
                        <p>Selected Trim Range: {startTime.toFixed(2)}s - {endTime.toFixed(2)}s</p>
                    </div>
                </>
            )}
        </div>
    );
};

export default AudioTrimmer;