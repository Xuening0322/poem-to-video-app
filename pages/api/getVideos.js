import fetch from 'node-fetch';

const BUCKET_NAME = process.env.GOOGLE_CLOUD_BUCKET;
const BUCKET_URL = `https://storage.googleapis.com/${BUCKET_NAME}`;

function parseDate(dateString) {
  try {
    // Try parsing as-is first
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    // If the date string contains hyphens from our filename format
    if (dateString.includes('-')) {
      // Replace multiple hyphens with single ones
      const cleanedDate = dateString.replace(/-+/g, '-');
      const date = new Date(cleanedDate);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    // If all parsing fails, return current date
    return new Date().toISOString();
  } catch (err) {
    console.error('Error parsing date:', dateString, err);
    return new Date().toISOString();
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Fetching from URL:', `${BUCKET_URL}?delimiter=/`);
    const response = await fetch(`${BUCKET_URL}?delimiter=/`);
    const xmlText = await response.text();
    
    console.log('XML Response:', xmlText.substring(0, 200) + '...'); // Log first 200 chars of XML
    
    // Parse XML to get file names
    const fileMatches = xmlText.match(/<Key>([^<]+)<\/Key>/g);
    console.log('File matches:', fileMatches);

    const fileNames = fileMatches
      ?.map(key => key.replace(/<Key>|<\/Key>/g, ''))
      ?.filter(name => name.endsWith('.mp4')) || [];
    
    console.log('Filtered file names:', fileNames);

    // Create video objects with safer date parsing
    const videos = fileNames.map(fileName => {
      console.log('Processing fileName:', fileName);
      
      const parts = fileName.split('-');
      console.log('File name parts:', parts);

      const dateString = parts[0];
      console.log('Date string to parse:', dateString);

      return {
        id: fileName,
        url: `${BUCKET_URL}/${fileName}`,
        title: parts[1] || 'Untitled',
        createdAt: parseDate(dateString)
      };
    });

    console.log('Processed videos:', videos);

    // Sort by creation date (newest first)
    const sortedVideos = videos.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    console.log('Returning sorted videos:', sortedVideos);
    return res.status(200).json(sortedVideos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return res.status(500).json({ 
      message: 'Error fetching videos',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}