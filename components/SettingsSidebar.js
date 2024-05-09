// components/SettingsSidebar.js
import React from 'react';

const SettingsSidebar = ({ onSettingsChange }) => {
  const handleDurationChange = (e) => {
    onSettingsChange({ duration: e.target.value });
  };

  const handleBpmChange = (e) => {
    onSettingsChange({ bpm: e.target.value });
  };

  const handleVideoStyleChange = (e) => {
    onSettingsChange({ videoStyle: e.target.value });
  };

  return (
    <div className="settings-sidebar">
      <div className="input-row">
        <label className="settings-label">
          Duration (seconds):
          <input type="number" min="5" max="15" defaultValue="15" step="5" onChange={handleDurationChange} className="settings-input" />
        </label>
        <label className="settings-label">
          BPM:
          <input type="number" min="60" max="180" defaultValue="120" step="1" onChange={handleBpmChange} className="settings-input" />
        </label>
        <label className="settings-label">
          Video Style:
          <select onChange={handleVideoStyleChange} className="settings-select">
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
