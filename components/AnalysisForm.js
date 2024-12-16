// components/AnalysisForm.js
import React, { useState } from 'react';

const AnalysisForm = ({ onSubmit }) => {
  const [poem, setPoem] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsAnalyzing(true);
    try {
      await onSubmit(poem);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="analysis-form">
      <textarea
        value={poem}
        onChange={(e) => setPoem(e.target.value)}
        placeholder="Type or paste your poem here..."
        rows="15"
        cols="50"
        className="analysis-textarea"
        disabled={isAnalyzing}
      />
      <button 
        type="submit" 
        className={`analysis-button ${isAnalyzing ? 'button-disabled' : ''}`}
        disabled={isAnalyzing}
      >
        {isAnalyzing && <span className="loading-spinner" />}
        {isAnalyzing ? 'Analyzing Poem...' : '🔍 Analyze My Poem'}
      </button>
    </form>
  );
};

export default AnalysisForm;
