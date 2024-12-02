// components/SettingsSidebar.js
import React, { useState, useEffect } from 'react';

const SettingsSidebar = ({ onSettingsChange }) => {
  // Initialize state to track current settings
  const [settings, setSettings] = useState({
    duration: 15,
    bpm: 120,
    videoStyle: 'Oil Painting'
  });

  // Handle duration changes with validation
  const handleDurationChange = (e) => {
    const value = parseInt(e.target.value);
    // Ensure duration is within valid range
    const validatedDuration = Math.min(Math.max(value, 5), 30);
    setSettings(prev => ({
      ...prev,
      duration: validatedDuration
    }));
    onSettingsChange({ duration: validatedDuration });
  };

  const handleBpmChange = (e) => {
    const value = parseInt(e.target.value);
    setSettings(prev => ({
      ...prev,
      bpm: value
    }));
    onSettingsChange({ bpm: value });
  };

  const handleVideoStyleChange = (e) => {
    setSettings(prev => ({
      ...prev,
      videoStyle: e.target.value
    }));
    onSettingsChange({ videoStyle: e.target.value });
  };

  // Effect to ensure initial settings are propagated
  useEffect(() => {
    onSettingsChange(settings);
  }, []);

  return (
    <div className="settings-sidebar">
      <div className="input-row">
        <label className="settings-label">
          Duration (seconds):
          <input
            type="number"
            min="5"
            max="60"
            value={settings.duration}
            onChange={handleDurationChange}
            className="settings-input"
          />
        </label>
        <label className="settings-label">
          BPM:
          <input
            type="number"
            min="60"
            max="180"
            value={settings.bpm}
            onChange={handleBpmChange}
            className="settings-input"
          />
        </label>
        <label className="settings-label">
          Video Style:
          <select
            value={settings.videoStyle}
            onChange={handleVideoStyleChange}
            className="settings-select"
          >
            <option value="Oil Painting">Oil Painting</option>
            <option value="Sketch">Sketch</option>
            <option value="Realistic">Realistic</option>
            <option value="Animation">Animation</option>
          </select>
        </label>
      </div>
    </div>
  );
};

export default SettingsSidebar;
