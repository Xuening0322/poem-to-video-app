// components/VideoGallery.js
import React, { useEffect, useState } from 'react';
import styles from '../styles/VideoGallery.module.css';

const VideoGallery = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/getVideos');
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      const data = await response.json();
      setVideos([...data].reverse());
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No videos generated yet</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {videos.map((video) => (
        <div key={video.id} className={styles.videoCard}>
          <video 
            className={styles.video}
            controls
            preload="metadata"
          >
            <source src={video.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      ))}
    </div>
  );
};

export default VideoGallery;