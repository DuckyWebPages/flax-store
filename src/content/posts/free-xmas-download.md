---
title: "Free Christmas Coloring Downloads"
description: "Free downloadable coloring pages for adults and children alike."
date: 2025-11-01
seo: "free coloring pages"
excerpt: "Free holiday coloring pages for our customers."
heroImage: "/images/xmas.jpg"
hideHero: true
---

<section class="xmas-card">
  <!-- Hero animation (top, centered, large) -->
  <div class="video-wrap" aria-label="Santa animation">
    <video
      src="/videos/santa.mp4"
      autoplay
      muted
      loop
      playsinline
      preload="auto"
    ></video>
  </div>

  <h2 class="xmas-title">Free Christmas Coloring Downloads</h2>

  <p class="xmas-intro">
    The holidays are upon us! If you’re an adult who loves to color—or you’ve got littles who do—feel free to download and print these pages for some cozy, creative fun.
  </p>

  <div class="download-list">
    <!-- Update the href if your filename differs -->
    <a class="dl" href="/downloads/Deck-the-Hulls.pdf" download>
      🎄 Deck the Hulls — Coloring Page (PDF)
    </a>
    <a class="dl" href="/downloads/coloringpagexmas.pdf" download>
      🎄 Merry Fishmas — Coloring Page (PDF)
    </a>
     <a class="dl" href="/downloads/xmasflax.pdf" download>
      🎄 Christmas Flax — Coloring Page (PDF)
    </a>
    <!-- Add more downloads here as you upload them -->
    <!-- <a class="dl" href="/downloads/snowman.pdf" download>☃️ Snowman — Coloring Page (PDF)</a> -->
  </div>
</section>

<style>
  .xmas-card{
    max-width: 900px;
    margin: 2rem auto;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 10px 24px rgba(0,0,0,.06);
  }

  /* Large, responsive hero video at the top */
  .video-wrap{
    width: 100%;
    margin: 0 auto 14px;
    height: clamp(240px, 32vw, 420px); /* grows with screen, starts ~2–3in tall */
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 6px 16px rgba(0,0,0,.08);
    background: #000;
  }
  .video-wrap video{
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .xmas-title{
    margin: 6px 0 8px;
    text-align: center;
    font-size: clamp(1.2rem, 2.2vw, 1.6rem);
  }

  .xmas-intro{
    margin: 0 auto 14px;
    max-width: 70ch;
    line-height: 1.6;
    color: #111827;
    text-align: center;
  }

  .download-list{
    display: grid;
    gap: 10px;
    margin-top: 10px;
    justify-items: center;
  }
  .dl{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 600;
    color: #0f172a;
    background: #f9fafb;
    box-shadow: 0 2px 8px rgba(0,0,0,.04);
  }
  .dl:hover{ background:#f3f4f6; }
</style>
