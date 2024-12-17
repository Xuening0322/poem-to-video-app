# 🎥 Poem-to-Video Generator

## Project Overview

"Poem-to-Video Generator" is a Next.js application that transforms poetic content into visually compelling music videos. By analyzing the poem's themes, emotions, and literary elements, this tool uses AI-powered integrations to generate music, videos, and voice narration, bringing the poem to life.

---

## 🖼️ Preview

1. **Main Interface**  
   The main page where users can generate voice narration, music, and videos from their poems.  
   [View the deployed page here.](https://poem-to-music-app-1062014131234.us-central1.run.app/)  

   ![Main Interface](public/UI.png)

2. **Video Gallery**  
   A dedicated gallery showcasing all generated videos for easy access and playback.  
   [Explore the video gallery here.](https://poem-to-music-app-1062014131234.us-central1.run.app/gallery)  

   ![Video Gallery](public/Gallery.png)

--- 

## 🚀 Getting Started

### 1. **Installation**
   - Clone the repository:
     ```bash
     git clone git@github.com:Xuening0322/poem-to-video-app.git
     cd poem-to-video
     ```
   - Install dependencies:
     ```bash
     npm install
     ```


### 2. **Environment Setup**
   - Create a `.env` file in the root directory.
   - Add API keys and Google Cloud configurations as follows:

     ```plaintext
     # Google Cloud Project Configuration
     GOOGLE_CLOUD_PROJECT=your-gcp-project
     GOOGLE_CLOUD_BUCKET=your-gcp-bucket
     GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account-email
     GOOGLE_CLOUD_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n

     # Spotify API Configuration
     SPOTIFY_CLIENT_ID=your_spotify_client_id
     SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

     # API Keys for External Integrations
     OPENAI_API_KEY=your_openai_api_key
     XI_API_KEY=your_eleven_labs_api_key
     REPLICATE_API_TOKEN=your_replicate_api_token

     # Node Environment
     NODE_ENV=development
     ```

   - Replace sensitive values (`YOUR_PRIVATE_KEY_HERE`, `your_openai_api_key`, etc.) with the actual keys.

   - **Environment-specific Setup**:  
     - If running in **local development**, set:
       ```plaintext
       NODE_ENV=development
       ```
     - If deploying to **production**, update the environment variable to:
       ```plaintext
       NODE_ENV=production
       ```


### 3. **Install Required Tools Locally**

1. **FFmpeg**  
   - FFmpeg is used for audio and video processing (e.g., trimming, combining media).  
   - Download and install FFmpeg from its [official website](https://www.ffmpeg.org/download.html).

   - **Verify Installation**: Run the following command in your terminal:  
     ```bash
     ffmpeg -version
     ```

2. **spotify-dl**  
   - [spotify-dl](https://github.com/SwapnilSoni1999/spotify-dl) is a tool for downloading Spotify tracks.  
   - Install `spotify-dl` using `npm` (ensure npm is installed):  
     ```bash
     npm install -g https://github.com/swapnilsoni1999/spotify-dl
     ```

   - **Verify Installation**:  
     ```bash
     spotifydl https://open.spotify.com/track/xyz
     ```



### 4. **Run the Development Server**
   - Start the local server:
     ```bash
     npm run dev
     ```
   - Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 Key Features

1. **Poem Analysis**  
   - Extracts literary elements such as themes, emotions, and key literals using **OpenAI** API.

2. **Music Generation**  
   - Generates music tailored to the poem’s analysis with adjustable BPM and duration using Meta's [MusicGen](https://github.com/facebookresearch/audiocraft) via **Replicate API**.

3. **Voice Narration**  
   - Converts poem text into high-quality voice narration via **Eleven Labs** API.

4. **Video Generation**  
   - Creates visually stylized videos synced to the generated music using **Stable Diffusion** via **Replicate API**.

5. **Spotify Integration**  
   - Allows users to:
     - Paste a Spotify track URL (e.g., `https://open.spotify.com/track/1234`)
     - Import and integrate music from Spotify seamlessly using `spotify-dl`.

6. **Audio Trimming**  
   - Offers tools for users to upload and trim audio to fit the video, powered by **FFmpeg**.

7. **Video Gallery**  
   - Provides a gallery to view and manage generated videos.

---

## 🛠 Project Structure

```
.
├── components/                # Reusable React components
│   ├── AnalysisForm.js        # Form for poem submission
│   ├── AudioTrimmer.js        # Audio trimming functionality
│   ├── DisplayAnalysis.js     # Displays analysis and controls for media generation
│   ├── SettingsSidebar.js     # Sidebar for user settings
│   └── VideoGallery.js        # Displays generated videos in a gallery view
│
├── pages/                     # Next.js routing and API handlers
│   ├── index.js               # Main page for poem-to-video generation
│   ├── gallery.js             # Page for viewing the generated video gallery
│   ├── audiotrimmer.js        # Page for audio trimming tools
│   ├── _app.js                # Custom App component for global setups
│   ├── api/                   # Backend API routes
│   │   ├── analyzePoem.js     # Handles poem analysis
│   │   ├── generateMusic.js   # Generates music from analysis
│   │   ├── generateVideo.js   # Generates video with prompts
│   │   ├── generateVideoPrompts.js # Generates video prompts based on poem analysis
│   │   ├── generateVoice.js   # Generates voice narration
│   │   ├── getVideos.js       # Fetches video gallery content
│   │   ├── processVideo.js    # Combines media into a final video
│   │   ├── remixMusic.js      # Handles music remixing (experimental)
│   │   ├── trimAudio.js       # Handles audio trimming
│   │   ├── spotify/
│   │   │   └── import.js      # Handles Spotify track importing
│
├── styles/                    # CSS Modules
│   ├── globals.css            # Global styles
│   ├── AudioTrimmer.module.css # Styles for the AudioTrimmer component
│   ├── Gallery.module.css     # Styles for the video gallery page
│   └── VideoGallery.module.css # Styles for the VideoGallery component
  ```
