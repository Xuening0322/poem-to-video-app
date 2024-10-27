// pages/api/spotify/analyze.js
import SpotifyWebApi from 'spotify-web-api-node';

export default async function handler(req, res) {
  const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
  });
  
  try {
    const auth = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(auth.body.access_token);
    
    const analysis = await spotifyApi.getAudioFeaturesForTrack(req.body.trackId);

    console.log(analysis)
    
    res.json(analysis.body);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}