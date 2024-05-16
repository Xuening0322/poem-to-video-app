# Poem-to-Video Generation

## Project Overview

This Next.js project, "Poem-to-Video Generation," is designed to analyze poems and generate music videos that reflect the essence, themes, and emotions of the poems. 

### Getting Started

1. **Installation**:
   - Clone the repository
   - Navigate to the project directory and install the dependencies with:
     ```
     npm install
     ```

2. **Environment Setup**:
   - Create a `.env` file in the root directory.
   - Add your API keys and other environment-specific settings.
     ```
     OPENAI_API_KEY=your_openai_api_key
     XI_API_KEY=your_eleven_labs_api_key
     REPLICATE_API_TOKEN=your_replicate_api_key
     ```

3. **Running the Application**:
   - Start the development server using:
     ```
     npm run dev
     ```
   - Open `http://localhost:3000` in your browser to view the application.

### Project Structure

- `pages/`: Contains the main pages of the application.
  - `index.js`: The main page where users interact with the poem analysis and video generation features.
  - `api/`: Server-side handlers for processing poems, generating music, and creating videos.
- `components/`: React components used across the application.
  - `AnalysisForm.js`: Form component for submitting poems.
  - `DisplayAnalysis.js`: Displays the results of the poem analysis and controls for generating music and videos.
  - `SettingsSidebar.js`: Sidebar for adjusting settings like BPM, video style, and duration.

### Key Features

- **Poem Analysis**: Analyze poems to extract themes, emotions, and other literary elements.
- **Music Generation**: Convert the analyzed data into a musical format and generate a music track.
- **Video Generation**: Create visual representations based on the poem’s themes and synced to the generated music.
- **Integration with AI**: Utilize OpenAI and Replicate APIs for advanced analysis and media generation.