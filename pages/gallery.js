// pages/gallery.js
import React from 'react';
import VideoGallery from '../components/VideoGallery';
import Link from 'next/link';

function BackButton({ href, text }) {
  return (
    <Link href={href} className="text-blue-600 hover:text-blue-800 transition-colors">
      ← {text}
    </Link>
  );
}

function PrimaryButton({ href, text }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
    >
      {text}
    </Link>
  );
}

export default function Gallery() {
  return (
    <main className="container mx-auto px-4 py-8">
      <nav className="mb-8">
        <BackButton href="/" text="Return to Home" />
      </nav>

      <section className="space-y-6">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Discover Your Generated Videos</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg sm:text-base">
            Dive into a world where poetry meets visuals. Each video here represents a unique blend of art, storytelling, and technology – an exclusive experience of poetry brought to life through AI.
          </p>
        </header>

        <section aria-labelledby="recent-generations" className="mb-8">
          <h2 id="recent-generations" className="text-2xl font-semibold mb-4">Latest Creations</h2>
          <VideoGallery />
        </section>

        <div className="mt-12 text-center">
          <PrimaryButton href="/" text="Generate Your Own Videos" />
        </div>
      </section>
    </main>
  );
}
