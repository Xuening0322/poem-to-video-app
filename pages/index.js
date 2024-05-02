// pages/index.js
import React, { useState } from 'react';
import AnalysisForm from '../components/AnalysisForm';
import DisplayAnalysis from '../components/DisplayAnalysis';
import SettingsSidebar from '../components/SettingsSidebar';

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
      <h1>🎵 Poem-to-Video Generation</h1>
      <p>This app analyzes a poem to extract its core essence, themes, and emotions, then generates a music video that visually interprets the poem's narrative. 📜🎶</p>
      <SettingsSidebar settings={settings} onSettingsChange={handleSettingsChange} />
      <AnalysisForm onSubmit={handlePoemSubmit} />
      <DisplayAnalysis analysis={analysis} duration={settings.duration} poemText={poem} bpm={settings.bpm} videoStyle={settings.videoStyle} />
    </div>
  );
}