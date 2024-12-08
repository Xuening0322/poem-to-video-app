'use client';

import { useEffect, useRef, useState } from 'react';
import styles from '../styles/AudioTrimmer.module.css';

const AudioTrimmer = ({ onSave, targetDuration }) => {
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
                    
                    // Use targetDuration if provided, otherwise use default or total duration
                    const initialEndTime = Math.min(targetDuration || 15, totalDuration);
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
    }, [audioURL]);

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
            
            // Call the onSave prop with the URL
            onSave?.(url);
            
        } catch (error) {
            setError(error.message || 'Error processing audio');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className={styles.audioTrimmer}>
            <div className={styles.fileInputContainer}>
                <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className={styles.fileInput}
                />
            </div>

            {error && (
                <div className={styles.errorMessage}>
                    {error}
                </div>
            )}

            <div className={styles.fileInfo}>
                {audioFile && <p>Selected file: {audioFile.name} ({audioFile.type})</p>}
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
                    disabled={isProcessing || !audioFile}
                    className={`${styles.button} ${styles.buttonSave}`}
                >
                    {isProcessing ? 'Processing...' : 'Use Trimmed Audio'}
                </button>
            </div>

            <div className={styles.trimRange}>
                <p>Selected Trim Range: {startTime.toFixed(2)}s - {endTime.toFixed(2)}s</p>
            </div>
        </div>
    );
};

export default AudioTrimmer;