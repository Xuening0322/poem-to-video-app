// pages/gallery.js
import React, { useState, useEffect } from 'react';
import VideoGallery from '../components/VideoGallery';
import Link from 'next/link';
import styles from '../styles/Gallery.module.css';

export default function Gallery() {
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // 模拟页面资源加载
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

      <h1 className={styles.title}>Discover Your Generated Videos</h1>
      <p className={styles.description}>
        Dive into a world where poetry meets visuals. Each video here represents a unique blend of art, storytelling, and technology – an exclusive experience of poetry brought to life through AI.
      </p>

      <h2 className={styles.subtitle}>Latest Creations</h2>
      <VideoGallery setPageLoading={setPageLoading} />
    </div>
  );
}
