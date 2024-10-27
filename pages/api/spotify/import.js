// pages/api/spotify/import.js
import SpotifyWebApi from 'spotify-web-api-node';

export default async function handler(req, res) {
  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
  });
  
  try {
    // Extract track ID from URL
    const trackId = req.body.spotifyUrl.split('/track/')[1].split('?')[0];
    
    // Get access token
    const auth = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(auth.body.access_token);
    
    // Get track
    const track = await spotifyApi.getTrack(trackId);
    
    console.log(track);

    res.json({
      track: track.body,
      previewUrl: track.body.preview_url
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}