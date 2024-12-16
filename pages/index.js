// pages/index.js
import React, { useState } from 'react';
import AnalysisForm from '../components/AnalysisForm';
import DisplayAnalysis from '../components/DisplayAnalysis';
import SettingsSidebar from '../components/SettingsSidebar';
import Link from 'next/link';

export default function Home() {
  const [analysis, setAnalysis] = useState('');
  const [poem, setPoem] = useState('');  // State to hold the poem text
  const [settings, setSettings] = useState({
    duration: 15,
    bpm: 120,
    videoStyle: 'Oil Painting',
  });

  const handlePoemSubmit = async (poem) => {
    setPoem(poem);  // Update poem state when the form is submitted
    try {
      const response = await fetch('/api/analyzePoem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          poem: poem,
          bpm: settings.bpm
        })
      });
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to analyze poem. Please try again.');
    }
  };

  const handleSettingsChange = (newSettings) => {
    setSettings({ ...settings, ...newSettings });
  };

  return (
    <div className="container">
      <h1>🎥 Poem-to-Video Generator</h1>
      <p>Transform your words into a captivating music video! ✨ This app analyzes your poem to uncover its core themes, emotions, and essence, then generates a music video that visually brings your narrative to life. 📜🎶</p>
      <Link
        href="/gallery"
        className="text-blue-600 hover:text-blue-800 transition-colors"
      >
        View Gallery →
      </Link>
      <SettingsSidebar settings={settings} onSettingsChange={handleSettingsChange} />
      <AnalysisForm onSubmit={handlePoemSubmit} />
      {analysis && (
        <DisplayAnalysis
          analysis={analysis}
          duration={settings.duration}
          poemText={poem}
          bpm={settings.bpm}
          videoStyle={settings.videoStyle}
        />
      )}

    </div>
  );
}