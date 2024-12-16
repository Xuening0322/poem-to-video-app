// pages/gallery.js
import React, { useState, useEffect } from 'react';
import VideoGallery from '../components/VideoGallery';
import Link from 'next/link';
import styles from '../styles/Gallery.module.css';

export default function Gallery() {
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (pageLoading) {
    return (
      <div className={styles.pageLoading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.backLink}>
          ← Return to Home
        </Link>
      </nav>

      <h1 className={styles.title}>Discover Generated Videos</h1>
      <p className={styles.description}>
        Experience the fusion of poetry, art, and technology. Each video transforms your words into a unique visual story, bringing the essence of your poem to life with AI-driven creativity.
      </p>

      <h2 className={styles.subtitle}>Explore Recent Creations</h2>
      <VideoGallery setPageLoading={setPageLoading} />
    </div>
  );
}
