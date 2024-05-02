// components/AnalysisForm.js
import React, { useState } from 'react';

const AnalysisForm = ({ onSubmit }) => {
  const [poem, setPoem] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(poem);
  };

  return (
    <form onSubmit={handleSubmit} className="analysis-form">
      <textarea
        value={poem}
        onChange={(e) => setPoem(e.target.value)}
        placeholder="Paste your poem here..."
        rows="10"
        cols="50"
        className="analysis-textarea"
      />
      <button type="submit" className="analysis-button">Analyze Poem</button>
    </form>
  );
};

export default AnalysisForm;
