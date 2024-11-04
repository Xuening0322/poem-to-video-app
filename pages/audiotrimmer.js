import { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Play, Pause, Square } from 'lucide-react';

// Dynamically import WaveSurfer
const WaveSurfer = dynamic(
  () => import('wavesurfer.js').then(module => module.default),
  { ssr: false }
);

export default function AudioTrimmer() {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const audioContext = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWaveSurferReady, setIsWaveSurferReady] = useState(false);
  const [originalFile, setOriginalFile] = useState(null);

  // Initialize WaveSurfer
  useEffect(() => {
    const initWaveSurfer = async () => {
      if (typeof window === 'undefined' || !waveformRef.current) return;

      try {
        const WaveSurferModule = await import('wavesurfer.js').then(module => module.default);
        
        if (wavesurfer.current) {
          wavesurfer.current.destroy();
        }

        wavesurfer.current = WaveSurferModule.create({
          container: waveformRef.current,
          waveColor: '#4353ff',
          progressColor: '#2196f3',
          cursorColor: '#333',
          backend: 'WebAudio',
          height: 100,
          normalize: true,
          minPxPerSec: 50,
          interact: true
        });

        wavesurfer.current.on('ready', () => {
          const duration = wavesurfer.current.getDuration();
          setEnd(duration);
          setIsWaveSurferReady(true);
        });

        wavesurfer.current.on('audioprocess', (time) => {
          setCurrentTime(time);
          if (time >= end) {
            wavesurfer.current.pause();
            setIsPlaying(false);
          }
        });

        wavesurfer.current.on('seek', (progress) => {
          const time = progress * wavesurfer.current.getDuration();
          setCurrentTime(time);
        });

        setIsWaveSurferReady(true);
      } catch (error) {
        console.error('Error initializing WaveSurfer:', error);
        alert('Error initializing audio visualizer. Please refresh and try again.');
      }
    };

    initWaveSurfer();

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [end]);

  // Load the audio file
  const loadAudio = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setOriginalFile(file);

      if (wavesurfer.current) {
        await wavesurfer.current.load(url);
        setStart(0);
        setEnd(wavesurfer.current.getDuration());
      }
    } catch (error) {
      console.error('Error loading audio:', error);
      alert('Error loading audio file. Please try again.');
    }
  };

  // Handle trimming
  const handleTrim = async () => {
    if (!audioUrl || !originalFile || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Create FormData and append the file and trim points
      const formData = new FormData();
      formData.append('audio', originalFile);
      formData.append('start', start.toString());
      formData.append('end', end.toString());

      // Send to API
      const response = await fetch('/api/trim-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to trim audio');
      }

      const data = await response.json();
      
      // Load the trimmed audio
      const trimmedUrl = data.url;
      setAudioUrl(trimmedUrl);
      
      if (wavesurfer.current) {
        await wavesurfer.current.load(trimmedUrl);
        setStart(0);
        setEnd(wavesurfer.current.getDuration());
      }

    } catch (error) {
      console.error('Error trimming audio:', error);
      alert('Error trimming audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle playback
  const togglePlayback = () => {
    if (!wavesurfer.current) return;

    if (isPlaying) {
      wavesurfer.current.pause();
    } else {
      if (currentTime >= end) {
        wavesurfer.current.seekTo(start / wavesurfer.current.getDuration());
      }
      wavesurfer.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Audio Trimmer</h2>
      
      <input 
        type="file" 
        accept="audio/*" 
        onChange={loadAudio}
        className="mb-4 block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100"
      />
      
      <div 
        ref={waveformRef} 
        className="w-full h-48 mb-4 bg-gray-50 rounded-lg border"
      />
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={togglePlayback}
          disabled={!isWaveSurferReady || !audioUrl}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button
          onClick={() => {
            if (wavesurfer.current) {
              wavesurfer.current.pause();
              wavesurfer.current.seekTo(0);
              setIsPlaying(false);
            }
          }}
          disabled={!isWaveSurferReady || !audioUrl}
          className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
        >
          <Square size={24} />
        </button>
        <div className="ml-4 flex items-center">
          <span className="text-sm text-gray-600">
            {currentTime.toFixed(2)}s / {end.toFixed(2)}s
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <label className="flex flex-col">
            <span className="text-sm text-gray-600 mb-1">Start Time (seconds):</span>
            <input
              type="number"
              value={start}
              onChange={(e) => setStart(Number(e.target.value))}
              min="0"
              max={end}
              step="0.1"
              className="border p-2 rounded-md w-32"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600 mb-1">End Time (seconds):</span>
            <input
              type="number"
              value={end}
              onChange={(e) => setEnd(Number(e.target.value))}
              min={start}
              max={wavesurfer.current ? wavesurfer.current.getDuration() : 0}
              step="0.1"
              className="border p-2 rounded-md w-32"
            />
          </label>
        </div>
        <button 
          onClick={handleTrim}
          disabled={!isWaveSurferReady || !audioUrl || isProcessing}
          className="bg-blue-500 text-white px-4 py-2 rounded-md 
            hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : 'Trim Audio'}
        </button>
      </div>
    </div>
  );
}