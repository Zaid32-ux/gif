import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * ============================================================================
 * STORYBOOK SCENES & CONFIGURATION
 * ============================================================================
 */
const SCENES = [
  {
    id: 0,
    title: 'A Starry Secret',
    duration: 7500,
    caption:
      "Once upon a time, under a sky full of stars, a little star came down with a special message: Today is Mantasha's birthday!",
    bg: 'linear-gradient(180deg, #12102e 0%, #261f54 55%, #4b3878 100%)',
  },
  {
    id: 1,
    title: 'Baking Something Sweet',
    duration: 8500,
    caption:
      'So Bunny and Bear baked the sweetest cake, filled with stardust, sprinkles, and warm wishes.',
    bg: 'linear-gradient(180deg, #221942 0%, #3d2960 55%, #6b447a 100%)',
  },
  {
    id: 2,
    title: 'Up, Up & Away',
    duration: 8000,
    caption:
      'They carried balloons and glowing lanterns through the sky to find you.',
    bg: 'linear-gradient(180deg, #14173d 0%, #2c2b68 55%, #5e4c8f 100%)',
  },
  {
    id: 3,
    title: 'Mantasha!',
    duration: 0, // Interactive pause until Mantasha blows out the candles
    caption:
      'Close your eyes and make a sweet wish, Mantasha... tap the cake or button to blow out your candles!',
    bg: 'linear-gradient(180deg, #17133a 0%, #342561 55%, #69427d 100%)',
  },
  {
    id: 4,
    title: 'Happy Birthday Mantasha!',
    duration: 0, // Grand finale stays open for celebration & keepsake note
    caption:
      'Wishing you endless joy, magic, and sweet moments all year round, dear Mantasha!',
    bg: 'linear-gradient(180deg, #1a133d 0%, #3d2466 55%, #7d4785 100%)',
  },
];

// Gentle "Happy Birthday" Music Box Lullaby Notes (frequency in Hz, duration in beats)
const LULLABY_NOTES = [
  { freq: 392.0, dur: 0.75 }, // G4
  { freq: 392.0, dur: 0.25 }, // G4
  { freq: 440.0, dur: 1.0 },  // A4
  { freq: 392.0, dur: 1.0 },  // G4
  { freq: 523.25, dur: 1.0 }, // C5
  { freq: 493.88, dur: 2.0 }, // B4
  { freq: 392.0, dur: 0.75 }, // G4
  { freq: 392.0, dur: 0.25 }, // G4
  { freq: 440.0, dur: 1.0 },  // A4
  { freq: 392.0, dur: 1.0 },  // G4
  { freq: 587.33, dur: 1.0 }, // D5
  { freq: 523.25, dur: 2.0 }, // C5
  { freq: 392.0, dur: 0.75 }, // G4
  { freq: 392.0, dur: 0.25 }, // G4
  { freq: 783.99, dur: 1.0 }, // G5
  { freq: 659.25, dur: 1.0 }, // E5
  { freq: 523.25, dur: 1.0 }, // C5
  { freq: 493.88, dur: 1.0 }, // B4
  { freq: 440.0, dur: 1.5 },  // A4
  { freq: 698.46, dur: 0.75 }, // F5
  { freq: 698.46, dur: 0.25 }, // F5
  { freq: 659.25, dur: 1.0 }, // E5
  { freq: 523.25, dur: 1.0 }, // C5
  { freq: 587.33, dur: 1.0 }, // D5
  { freq: 523.25, dur: 2.5 }, // C5
];

const PASTEL_COLORS = [
  '#FFB3C6', // Strawberry Pink
  '#FFD6A5', // Peach Cream
  '#FDFFB6', // Butter Yellow
  '#CAFFBF', // Mint Pastel
  '#A0C4FF', // Sky Blue
  '#BDB2FF', // Soft Lavender
  '#FFC6FF', // Fairy Lilac
];

/**
 * ============================================================================
 * WEB AUDIO API MUSIC BOX & SOUND EFFECTS SYNTHESIZER (ZERO DEPENDENCIES)
 * ============================================================================
 */
class StorybookAudio {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.timerId = null;
    this.noteIdx = 0;
  }

  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch {
      // Ignore if browser blocks Web Audio
    }
  }

  playTone(freq, duration = 1.0, volume = 0.075, type = 'sine') {
    if (!this.ctx || !this.isPlaying) return;
    try {
      const now = this.ctx.currentTime;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      gain.connect(this.ctx.destination);

      const osc = this.ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(gain);

      // Soft music-box bell overtone
      const overGain = this.ctx.createGain();
      overGain.gain.setValueAtTime(0.0001, now);
      overGain.gain.linearRampToValueAtTime(volume * 0.25, now + 0.01);
      overGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.45);
      overGain.connect(this.ctx.destination);

      const overOsc = this.ctx.createOscillator();
      overOsc.type = 'triangle';
      overOsc.frequency.setValueAtTime(freq * 2, now);
      overOsc.connect(overGain);

      osc.start(now);
      overOsc.start(now);
      osc.stop(now + duration + 0.05);
      overOsc.stop(now + duration * 0.5);
    } catch {
      // Ignore scheduling errors
    }
  }

  playSparkle() {
    if (!this.isPlaying) return;
    [880, 1174.66, 1318.51].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.32, 0.05, 'sine'), i * 55);
    });
  }

  playPop() {
    if (!this.ctx || !this.isPlaying) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.08);
      gain.gain.setValueAtTime(0.065, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Ignore
    }
  }

  playBlowOut() {
    if (!this.ctx || !this.isPlaying) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(750, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();

      setTimeout(() => this.playCelebration(), 350);
    } catch {
      // Ignore
    }
  }

  playCelebration() {
    if (!this.isPlaying) return;
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.85, 0.06, 'sine'), i * 75);
    });
  }

  scheduleNext() {
    if (!this.isPlaying) return;
    const note = LULLABY_NOTES[this.noteIdx];
    const beatMs = 470;
    this.playTone(note.freq, (note.dur * beatMs) / 1000 + 0.55, 0.07);
    this.noteIdx = (this.noteIdx + 1) % LULLABY_NOTES.length;
    this.timerId = setTimeout(() => this.scheduleNext(), note.dur * beatMs);
  }

  start() {
    this.init();
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.scheduleNext();
  }

  stop() {
    this.isPlaying = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  destroy() {
    this.stop();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        // Ignore
      }
      this.ctx = null;
    }
  }
}

/**
 * ============================================================================
 * CRISP INLINE UI SVG ICONS (NO LUCIDE-REACT REQUIRED)
 * ============================================================================
 */
const IconMusicOn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const IconMusicOff = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

const IconPlay = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="6 4 20 12 6 20 6 4" />
  </svg>
);

const IconPause = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/**
 * ============================================================================
 * HAND-CRAFTED KAWAII STORYBOOK SVG CHARACTERS & PROPS (800x500 STAGE SPACE)
 * ============================================================================
 */

/** Fluffy White Bunny (native size ~140x165) */
function BunnyGroup({ x = 0, y = 0, scale = 1, partyHat = false, happyJump = false, waving = false }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <g className={happyJump ? 'hbm-jump' : ''}>
        {/* Ground shadow */}
        <ellipse cx="70" cy="154" rx="34" ry="7" fill="rgba(18, 12, 42, 0.25)" />
        {/* Fluffy Tail */}
        <circle cx="34" cy="132" r="11" fill="#FFFDF9" />

        {/* Left Ear */}
        <g className="hbm-ear-left" style={{ transformOrigin: '54px 65px' }}>
          <ellipse cx="50" cy="36" rx="12" ry="30" transform="rotate(-12 50 36)" fill="#FFFDF9" stroke="#F3E5F5" strokeWidth="2" />
          <ellipse cx="50" cy="38" rx="6" ry="20" transform="rotate(-12 50 38)" fill="#FFC2D4" />
        </g>

        {/* Right Ear */}
        <g className="hbm-ear-right" style={{ transformOrigin: '86px 65px' }}>
          <ellipse cx="90" cy="36" rx="12" ry="30" transform="rotate(14 90 36)" fill="#FFFDF9" stroke="#F3E5F5" strokeWidth="2" />
          <ellipse cx="90" cy="38" rx="6" ry="20" transform="rotate(14 90 38)" fill="#FFC2D4" />
        </g>

        {/* Optional Party Hat */}
        {partyHat && (
          <g transform="translate(54, 14) rotate(-6)">
            <polygon points="16,0 0,34 32,34" fill="#FFB3C6" stroke="#FFF" strokeWidth="1.5" />
            <path d="M6,22 L26,22" stroke="#FDFFB6" strokeWidth="4" strokeLinecap="round" />
            <path d="M10,12 L22,12" stroke="#A0C4FF" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="16" cy="0" r="5" fill="#FDFFB6" />
          </g>
        )}

        {/* Body & Belly */}
        <ellipse cx="70" cy="122" rx="32" ry="30" fill="#FFFDF9" stroke="#F3E5F5" strokeWidth="2" />
        <ellipse cx="70" cy="126" rx="18" ry="18" fill="#FFF0F5" />

        {/* Feet */}
        <ellipse cx="52" cy="148" rx="11" ry="7" fill="#FFFDF9" stroke="#F3E5F5" strokeWidth="1.5" />
        <ellipse cx="88" cy="148" rx="11" ry="7" fill="#FFFDF9" stroke="#F3E5F5" strokeWidth="1.5" />

        {/* Left Arm */}
        <ellipse cx="42" cy="118" rx="9" ry="13" transform="rotate(24 42 118)" fill="#FFFDF9" stroke="#F3E5F5" strokeWidth="1.5" />

        {/* Right Arm */}
        <g className={waving ? 'hbm-wave' : ''} style={{ transformOrigin: '94px 115px' }}>
          <ellipse
            cx="98"
            cy={waving ? '106' : '118'}
            rx="9"
            ry="13"
            transform={waving ? 'rotate(-42 98 106)' : 'rotate(-24 98 118)'}
            fill="#FFFDF9"
            stroke="#F3E5F5"
            strokeWidth="1.5"
          />
        </g>

        {/* Head */}
        <ellipse cx="70" cy="80" rx="34" ry="29" fill="#FFFDF9" stroke="#F3E5F5" strokeWidth="2" />

        {/* Rosy Cheeks */}
        <ellipse cx="48" cy="87" rx="7" ry="4.5" fill="#FF9EBB" opacity="0.65" />
        <ellipse cx="92" cy="87" rx="7" ry="4.5" fill="#FF9EBB" opacity="0.65" />

        {/* Blinking Kawaii Eyes */}
        <g className="hbm-blink" style={{ transformOrigin: '70px 78px' }}>
          <circle cx="56" cy="78" r="4.5" fill="#3B2B47" />
          <circle cx="54.5" cy="76.5" r="1.6" fill="#FFFFFF" />
          <circle cx="84" cy="78" r="4.5" fill="#3B2B47" />
          <circle cx="82.5" cy="76.5" r="1.6" fill="#FFFFFF" />
        </g>

        {/* Nose & Mouth */}
        <ellipse cx="70" cy="84" rx="3.2" ry="2.2" fill="#FF85A1" />
        <path d="M64,88 Q67,92 70,88 Q73,92 76,88" fill="none" stroke="#5C446B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  );
}

/** Cute Chubby Bear (native size ~140x165) */
function BearGroup({ x = 0, y = 0, scale = 1, chefHat = false, partyHat = false, happyJump = false, waving = false }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <g className={happyJump ? 'hbm-jump-delayed' : ''}>
        {/* Shadow */}
        <ellipse cx="70" cy="154" rx="36" ry="7" fill="rgba(18, 12, 42, 0.25)" />

        {/* Round Ears */}
        <circle cx="43" cy="54" r="13" fill="#C68B59" stroke="#A66E42" strokeWidth="2" />
        <circle cx="43" cy="54" r="7" fill="#F2D0A9" />
        <circle cx="97" cy="54" r="13" fill="#C68B59" stroke="#A66E42" strokeWidth="2" />
        <circle cx="97" cy="54" r="7" fill="#F2D0A9" />

        {/* Optional Chef Hat */}
        {chefHat && (
          <g transform="translate(46, 12)">
            <circle cx="12" cy="18" r="11" fill="#FFFFFF" stroke="#E5DCF0" strokeWidth="1.5" />
            <circle cx="24" cy="12" r="13" fill="#FFFFFF" stroke="#E5DCF0" strokeWidth="1.5" />
            <circle cx="36" cy="18" r="11" fill="#FFFFFF" stroke="#E5DCF0" strokeWidth="1.5" />
            <rect x="9" y="24" width="30" height="13" rx="4" fill="#FFFFFF" stroke="#E5DCF0" strokeWidth="1.5" />
            <line x1="16" y1="24" x2="16" y2="36" stroke="#F0E6F6" strokeWidth="1.5" />
            <line x1="24" y1="24" x2="24" y2="36" stroke="#F0E6F6" strokeWidth="1.5" />
            <line x1="32" y1="24" x2="32" y2="36" stroke="#F0E6F6" strokeWidth="1.5" />
          </g>
        )}

        {/* Optional Party Hat */}
        {partyHat && (
          <g transform="translate(55, 16) rotate(8)">
            <polygon points="15,0 0,32 30,32" fill="#A0C4FF" stroke="#FFF" strokeWidth="1.5" />
            <circle cx="15" cy="18" r="3" fill="#FDFFB6" />
            <circle cx="9" cy="25" r="2.5" fill="#FFB3C6" />
            <circle cx="21" cy="25" r="2.5" fill="#CAFFBF" />
            <circle cx="15" cy="0" r="5" fill="#FFB3C6" />
          </g>
        )}

        {/* Body & Belly */}
        <ellipse cx="70" cy="122" rx="36" ry="31" fill="#C68B59" stroke="#A66E42" strokeWidth="2" />
        <ellipse cx="70" cy="126" rx="21" ry="19" fill="#F2D0A9" />

        {/* Feet */}
        <ellipse cx="50" cy="148" rx="12" ry="8" fill="#C68B59" stroke="#A66E42" strokeWidth="1.5" />
        <ellipse cx="90" cy="148" rx="12" ry="8" fill="#C68B59" stroke="#A66E42" strokeWidth="1.5" />

        {/* Left Arm */}
        <g className={waving ? 'hbm-wave-left' : ''} style={{ transformOrigin: '45px 115px' }}>
          <ellipse
            cx="38"
            cy={waving ? '105' : '118'}
            rx="10"
            ry="14"
            transform={waving ? 'rotate(42 38 105)' : 'rotate(24 38 118)'}
            fill="#C68B59"
            stroke="#A66E42"
            strokeWidth="1.5"
          />
        </g>

        {/* Right Arm */}
        <ellipse cx="102" cy="118" rx="10" ry="14" transform="rotate(-24 102 118)" fill="#C68B59" stroke="#A66E42" strokeWidth="1.5" />

        {/* Head & Snout */}
        <ellipse cx="70" cy="79" rx="36" ry="31" fill="#C68B59" stroke="#A66E42" strokeWidth="2" />
        <ellipse cx="70" cy="88" rx="15" ry="11" fill="#F6DFC4" />

        {/* Rosy Cheeks */}
        <ellipse cx="45" cy="86" rx="6.5" ry="4" fill="#FF8FA3" opacity="0.6" />
        <ellipse cx="95" cy="86" rx="6.5" ry="4" fill="#FF8FA3" opacity="0.6" />

        {/* Blinking Eyes */}
        <g className="hbm-blink-delayed" style={{ transformOrigin: '70px 76px' }}>
          <circle cx="55" cy="76" r="4.3" fill="#3B2314" />
          <circle cx="53.6" cy="74.6" r="1.5" fill="#FFFFFF" />
          <circle cx="85" cy="76" r="4.3" fill="#3B2314" />
          <circle cx="83.6" cy="74.6" r="1.5" fill="#FFFFFF" />
        </g>

        {/* Nose & Smile */}
        <ellipse cx="70" cy="84" rx="4.5" ry="3.2" fill="#4A2C1D" />
        <path d="M64,91 Q70,96 76,91" fill="none" stroke="#4A2C1D" strokeWidth="2" strokeLinecap="round" />
      </g>
    </g>
  );
}

/** 3-Tier Pastel Strawberry Birthday Cake (native size ~200x205) */
function CakeGroup({
  x = 0,
  y = 0,
  scale = 1,
  showCandles = false,
  candlesLit = true,
  blowingOut = false,
  extraSprinkles = [],
  onClick,
}) {
  const candlePositions = [64, 82, 100, 118, 136];
  const stripeColors = ['#FFB3C6', '#A0C4FF', '#CAFFBF', '#BDB2FF', '#FFD6A5'];

  return (
    <g
      transform={`translate(${x}, ${y}) scale(${scale})`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Warm Candle Glow */}
      {showCandles && candlesLit && (
        <ellipse cx="100" cy="68" rx="88" ry="62" fill="url(#hbmCandleGlow)" className="hbm-pulse" />
      )}

      {/* Cake Plate */}
      <ellipse cx="100" cy="186" rx="76" ry="12" fill="#F8EDEB" stroke="#E8D1D5" strokeWidth="2" />
      <ellipse cx="100" cy="183" rx="64" ry="8" fill="#FFFFFF" />

      {/* Bottom Tier (Strawberry Pink) */}
      <rect x="36" y="138" width="128" height="44" rx="10" fill="#FFB3C6" stroke="#FF8FAB" strokeWidth="2" />
      <path
        d="M36,144 Q46,158 56,146 Q66,162 78,146 Q90,159 100,147 Q112,162 124,146 Q136,158 148,146 Q156,156 164,144 L164,138 L36,138 Z"
        fill="#FFFDF9"
      />

      {/* Middle Tier (Lavender Cream) */}
      <rect x="52" y="100" width="96" height="40" rx="9" fill="#D8BBFF" stroke="#BFA0F2" strokeWidth="2" />
      <path
        d="M52,106 Q62,120 72,108 Q84,122 96,108 Q108,121 120,108 Q134,120 148,106 L148,100 L52,100 Z"
        fill="#FFF5F8"
      />

      {/* Top Tier (Buttercream Vanilla) */}
      <rect x="68" y="68" width="64" height="34" rx="8" fill="#FFF1C1" stroke="#F4D37C" strokeWidth="2" />
      <path
        d="M68,74 Q78,86 88,75 Q100,87 112,75 Q122,85 132,74 L132,68 L68,68 Z"
        fill="#FFFFFF"
      />

      {/* Strawberries */}
      <g className="hbm-bob">
        {[
          [74, 57],
          [114, 57],
          [55, 89],
          [133, 89],
        ].map(([sx, sy], idx) => (
          <g key={idx} transform={`translate(${sx}, ${sy})`}>
            <path d="M6,2 C10,2 12,8 6,13 C0,8 2,2 6,2 Z" fill="#FF4D6D" />
            <path d="M3,3 L6,0 L9,3" fill="none" stroke="#52B788" strokeWidth="2" strokeLinecap="round" />
          </g>
        ))}
      </g>

      {/* Default Sprinkles */}
      <rect x="48" y="162" width="7" height="3" rx="1.5" fill="#FDFFB6" transform="rotate(20 48 162)" />
      <rect x="74" y="168" width="7" height="3" rx="1.5" fill="#A0C4FF" transform="rotate(-15 74 168)" />
      <rect x="108" y="164" width="7" height="3" rx="1.5" fill="#CAFFBF" transform="rotate(35 108 164)" />
      <rect x="138" y="166" width="7" height="3" rx="1.5" fill="#FFFFFF" transform="rotate(-25 138 166)" />
      <rect x="68" y="126" width="6" height="3" rx="1.5" fill="#FFB3C6" transform="rotate(15 68 126)" />
      <rect x="102" y="128" width="6" height="3" rx="1.5" fill="#FDFFB6" transform="rotate(-30 102 128)" />
      <rect x="128" y="124" width="6" height="3" rx="1.5" fill="#CAFFBF" transform="rotate(25 128 124)" />

      {/* User-Tossed Interactive Sprinkles & Hearts */}
      {extraSprinkles.map((sp) => (
        <g key={sp.id} className="hbm-sprinkle-pop">
          {sp.isHeart ? (
            <path
              d={`M ${sp.x} ${sp.y} c -2,-2.5 -6,-1 -6,2 c 0,3 6,6 6,6 c 0,0 6,-3 6,-6 c 0,-3 -4,-4.5 -6,-2 z`}
              fill={sp.color}
            />
          ) : (
            <rect
              x={sp.x}
              y={sp.y}
              width="7"
              height="3.2"
              rx="1.6"
              fill={sp.color}
              transform={`rotate(${sp.rot} ${sp.x} ${sp.y})`}
            />
          )}
        </g>
      ))}

      {/* 5 Animated Candles */}
      {showCandles && (
        <g>
          {candlePositions.map((cx, idx) => (
            <g key={cx}>
              <rect x={cx - 3.5} y={42} width="7" height="26" rx="2" fill={stripeColors[idx]} stroke="#FFFFFF" strokeWidth="1" />
              <line x1={cx} y1={38} x2={cx} y2={42} stroke="#4A3550" strokeWidth="1.5" />

              {candlesLit && (
                <g className="hbm-flicker" style={{ transformOrigin: `${cx}px 38px` }}>
                  <ellipse cx={cx} cy={30} rx="7" ry="10" fill="#FFE599" opacity="0.45" />
                  <path
                    d={`M ${cx} 22 C ${cx + 5} 29, ${cx + 4} 37, ${cx} 38 C ${cx - 4} 37, ${cx - 5} 29, ${cx} 22 Z`}
                    fill="#FF9F1C"
                  />
                  <path
                    d={`M ${cx} 27 C ${cx + 2.5} 31, ${cx + 2} 36, ${cx} 37 C ${cx - 2} 36, ${cx - 2.5} 31, ${cx} 27 Z`}
                    fill="#FFF8D6"
                  />
                </g>
              )}

              {!candlesLit && (
                <path
                  d={`M ${cx} 37 Q ${cx - 5} 28 ${cx + 2} 20 Q ${cx + 7} 12 ${cx - 2} 4`}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.78)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className="hbm-smoke"
                />
              )}
            </g>
          ))}

          {/* Animated Gust of Wind when Blowing Candles */}
          {blowingOut && (
            <g className="hbm-wind">
              <path d="M 14 30 Q 48 24 80 31" fill="none" stroke="#E0F7FA" strokeWidth="2.8" strokeLinecap="round" />
              <path d="M 6 40 Q 44 35 76 42" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M 22 20 Q 52 15 84 22" fill="none" stroke="#BDB2FF" strokeWidth="2.2" strokeLinecap="round" />
            </g>
          )}
        </g>
      )}
    </g>
  );
}

/** Pastel Gift Box (Closed or Popped Open) */
function GiftBoxGroup({ x = 0, y = 0, scale = 1, open = false }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {open && (
        <g className="hbm-pulse">
          <polygon points="55,52 10,-6 42,-6" fill="#FDFFB6" opacity="0.38" />
          <polygon points="55,52 68,-6 100,-6" fill="#FFB3C6" opacity="0.38" />
          <polygon points="55,52 36,-10 74,-10" fill="#FFFFFF" opacity="0.45" />
        </g>
      )}
      <rect x="20" y="50" width="70" height="54" rx="8" fill="#BDB2FF" stroke="#9B89F5" strokeWidth="2" />
      <rect x="49" y="50" width="12" height="54" fill="#FFD166" />
      <g
        style={{
          transformOrigin: '20px 50px',
          transform: open ? 'rotate(-42deg) translate(-8px, -16px)' : 'none',
          transition: 'transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <rect x="14" y="34" width="82" height="18" rx="6" fill="#FFC6FF" stroke="#E7A1F5" strokeWidth="2" />
        <rect x="49" y="34" width="12" height="18" fill="#FFD166" />
        <path d="M55,34 C40,14 24,24 38,34 Z" fill="#FFD166" stroke="#F4B942" strokeWidth="1.5" />
        <path d="M55,34 C70,14 86,24 72,34 Z" fill="#FFD166" stroke="#F4B942" strokeWidth="1.5" />
        <circle cx="55" cy="33" r="5" fill="#FFE699" />
      </g>
    </g>
  );
}

/** Smiling Crescent Moon */
function MoonGroup({ x = 660, y = 26, scale = 0.95 }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <circle cx="60" cy="60" r="56" fill="url(#hbmMoonAura)" />
      <path
        d="M72,22 C46,24 30,45 34,70 C38,93 60,104 82,94 C64,92 52,78 52,60 C52,42 60,30 72,22 Z"
        fill="#FFF3B0"
        stroke="#FFE57F"
        strokeWidth="1.5"
      />
      <path d="M44,58 Q47,61 50,58" fill="none" stroke="#B88E44" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M46,66 Q49,69 52,66" fill="none" stroke="#B88E44" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="43" cy="63" r="2.2" fill="#FF9EBB" opacity="0.65" />
    </g>
  );
}

/** Hanging Warm Fairy Lights Garland */
function FairyLightsGroup({ y = 0 }) {
  const bulbs = [
    { x: 55, y: 31, c: '#FFE599' },
    { x: 120, y: 45, c: '#FFB3C6' },
    { x: 190, y: 48, c: '#FFF3B0' },
    { x: 260, y: 36, c: '#A0C4FF' },
    { x: 330, y: 24, c: '#FFE599' },
    { x: 400, y: 38, c: '#FFC6FF' },
    { x: 470, y: 48, c: '#FFF3B0' },
    { x: 540, y: 42, c: '#CAFFBF' },
    { x: 610, y: 28, c: '#FFE599' },
    { x: 680, y: 40, c: '#FFB3C6' },
    { x: 745, y: 34, c: '#FFF3B0' },
  ];

  return (
    <g transform={`translate(0, ${y})`}>
      <path d="M0,12 Q180,72 330,24 Q500,72 610,28 Q700,62 800,14" fill="none" stroke="rgba(255, 240, 210, 0.45)" strokeWidth="2" />
      {bulbs.map((b, i) => (
        <g key={i} className="hbm-fairy" style={{ animationDelay: `${i * 0.25}s` }}>
          <circle cx={b.x} cy={b.y + 4} r="13" fill={b.c} opacity="0.28" />
          <circle cx={b.x} cy={b.y + 4} r="5" fill={b.c} />
          <circle cx={b.x} cy={b.y + 4} r="2.2" fill="#FFFFFF" />
        </g>
      ))}
    </g>
  );
}

/** Pastel Festive Bunting Flags */
function BuntingGroup() {
  const flags = [
    { x: 40, y: 22, c: '#FFB3C6' },
    { x: 110, y: 36, c: '#FDFFB6' },
    { x: 185, y: 44, c: '#A0C4FF' },
    { x: 260, y: 46, c: '#CAFFBF' },
    { x: 335, y: 40, c: '#BDB2FF' },
    { x: 410, y: 30, c: '#FFD6A5' },
    { x: 485, y: 38, c: '#FFB3C6' },
    { x: 560, y: 44, c: '#A0C4FF' },
    { x: 635, y: 40, c: '#FDFFB6' },
    { x: 710, y: 28, c: '#FFC6FF' },
  ];

  return (
    <g>
      <path d="M0,14 Q220,68 410,30 Q600,68 800,16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
      {flags.map((f, idx) => (
        <polygon
          key={idx}
          points={`${f.x},${f.y} ${f.x + 44},${f.y + 4} ${f.x + 20},${f.y + 36}`}
          fill={f.c}
          opacity="0.92"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="1"
        />
      ))}
    </g>
  );
}

/**
 * ============================================================================
 * MAIN APPLICATION COMPONENT (VIEWPORT-LOCKED 100vw x 100dvh, ZERO OVERFLOW)
 * ============================================================================
 */
export default function App() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [soundOn, setSoundOn] = useState(false);

  // Interactive Scene States
  const [extraSprinkles, setExtraSprinkles] = useState([]);
  const [candlesLit, setCandlesLit] = useState(true);
  const [blowingOut, setBlowingOut] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Refs for Canvas, Root, & Web Audio
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const particlesRef = useRef([]);
  const fireworksRef = useRef([]);
  const confettiRef = useRef([]);
  const starsRef = useRef([]);
  const firefliesRef = useRef([]);

  // Initialize & Clean up Web Audio Engine
  useEffect(() => {
    audioRef.current = new StorybookAudio();
    return () => {
      if (audioRef.current) audioRef.current.destroy();
    };
  }, []);

  /** Launch Pastel Fireworks & Confetti Bursts on Canvas */
  const launchCelebrationBurst = useCallback((count = 3) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;

    for (let b = 0; b < count; b++) {
      const fx = w * (0.18 + Math.random() * 0.64);
      const fy = h * (0.16 + Math.random() * 0.34);
      const baseColor = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
      for (let i = 0; i < 28; i++) {
        const angle = (Math.PI * 2 * i) / 28 + Math.random() * 0.15;
        const speed = 1.4 + Math.random() * 3.4;
        fireworksRef.current.push({
          x: fx,
          y: fy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: Math.random() > 0.3 ? baseColor : '#FFFFFF',
          size: 2 + Math.random() * 2.5,
          life: 0,
          maxLife: 55 + Math.random() * 30,
        });
      }
    }

    for (let i = 0; i < 46; i++) {
      confettiRef.current.push({
        x: w * (0.15 + Math.random() * 0.7),
        y: h * (0.08 + Math.random() * 0.25),
        vx: (Math.random() - 0.5) * 4.2,
        vy: -2.2 - Math.random() * 3.2,
        w: 6 + Math.random() * 6,
        h: 4 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
        life: 0,
        maxLife: 155 + Math.random() * 85,
      });
    }
  }, []);

  /** Spawn Floating Pastel Hearts & Sparkles at Tap/Click Position */
  const spawnTapMagic = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 0.6 + Math.random() * 2.0;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 0.85,
        size: 5 + Math.random() * 6,
        color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
        isHeart: Math.random() > 0.4,
        life: 0,
        maxLife: 48 + Math.random() * 28,
      });
    }
  }, []);

  // Trigger Celebration Fireworks automatically when entering Scene 5
  useEffect(() => {
    if (sceneIdx === 4) {
      launchCelebrationBurst(4);
      if (audioRef.current) audioRef.current.playCelebration();
      const periodic = setInterval(() => {
        launchCelebrationBurst(1);
      }, 3600);
      return () => clearInterval(periodic);
    }
  }, [sceneIdx, launchCelebrationBurst]);

  // Smooth Auto-Play Progression for Scenes 1–3
  useEffect(() => {
    if (!isAutoPlay) return;
    const duration = SCENES[sceneIdx].duration;
    if (!duration || duration <= 0) return;

    const timer = setTimeout(() => {
      setSceneIdx((prev) => (prev < SCENES.length - 1 ? prev + 1 : prev));
    }, duration);
    return () => clearTimeout(timer);
  }, [sceneIdx, isAutoPlay]);

  /**
   * 60FPS FULL-SCREEN BACKGROUND CANVAS ENGINE
   * Dynamically resized via ResizeObserver & window resize with DPR scaling
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = rootRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = container.clientWidth || window.innerWidth;
    let h = container.clientHeight || window.innerHeight;

    const initSky = () => {
      const starCount = Math.min(110, Math.max(45, Math.floor((w * h) / 9500)));
      starsRef.current = Array.from({ length: starCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.82,
        r: 0.6 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.035,
      }));

      firefliesRef.current = Array.from({ length: 20 }, () => ({
        x: Math.random() * w,
        y: h * 0.25 + Math.random() * h * 0.65,
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.32,
        r: 1.8 + Math.random() * 2.4,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() > 0.35 ? '#FFF3B0' : '#FFC6FF',
      }));
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = container.clientWidth || window.innerWidth;
      h = container.clientHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initSky();
    };

    resize();
    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(resize);
      observer.observe(container);
    }
    window.addEventListener('resize', resize);

    const drawHeart = (x, y, size, color, alpha) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.translate(x, y);
      ctx.beginPath();
      const s = size * 0.55;
      ctx.moveTo(0, s * 0.35);
      ctx.bezierCurveTo(-s, -s * 0.6, -s * 1.4, s * 0.5, 0, s * 1.45);
      ctx.bezierCurveTo(s * 1.4, s * 0.5, s, -s * 0.6, 0, s * 0.35);
      ctx.fill();
      ctx.restore();
    };

    let animId;
    const render = () => {
      ctx.clearRect(0, 0, w, h);

      // 1. Twinkling Stars
      for (let i = 0; i < starsRef.current.length; i++) {
        const st = starsRef.current[i];
        st.phase += st.speed;
        const alpha = 0.25 + 0.7 * (0.5 + 0.5 * Math.sin(st.phase));
        ctx.fillStyle = `rgba(255, 250, 235, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Floating Pastel Stardust / Fireflies
      for (let i = 0; i < firefliesRef.current.length; i++) {
        const ff = firefliesRef.current[i];
        ff.phase += 0.03;
        ff.x += ff.vx + Math.sin(ff.phase) * 0.2;
        ff.y += ff.vy + Math.cos(ff.phase * 0.8) * 0.15;
        if (ff.x < -16) ff.x = w + 16;
        if (ff.x > w + 16) ff.x = -16;
        if (ff.y < h * 0.15) ff.vy = Math.abs(ff.vy);
        if (ff.y > h * 0.92) ff.vy = -Math.abs(ff.vy);

        const glowAlpha = 0.28 + 0.62 * (0.5 + 0.5 * Math.sin(ff.phase * 1.4));
        const grad = ctx.createRadialGradient(ff.x, ff.y, 0, ff.x, ff.y, ff.r * 5);
        grad.addColorStop(0, ff.color);
        grad.addColorStop(1, 'rgba(255, 243, 176, 0)');
        ctx.save();
        ctx.globalAlpha = glowAlpha;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ff.x, ff.y, ff.r * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ff.x, ff.y, ff.r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Interactive Tap Hearts & Sparkles
      particlesRef.current = particlesRef.current.filter((pt) => {
        pt.life += 1;
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vx *= 0.98;
        pt.vy *= 0.98;
        const alpha = Math.max(0, 1 - pt.life / pt.maxLife);
        if (pt.isHeart) {
          drawHeart(pt.x, pt.y, pt.size, pt.color, alpha);
        } else {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        return pt.life < pt.maxLife;
      });

      // 4. Pastel Fireworks (Scene 5)
      fireworksRef.current = fireworksRef.current.filter((fw) => {
        fw.life += 1;
        fw.x += fw.vx;
        fw.y += fw.vy;
        fw.vy += 0.035;
        fw.vx *= 0.975;
        fw.vy *= 0.975;
        const alpha = Math.max(0, 1 - fw.life / fw.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = fw.color;
        ctx.shadowColor = fw.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(fw.x, fw.y, fw.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return fw.life < fw.maxLife;
      });

      // 5. Pastel Confetti Ribbons (Scene 5)
      confettiRef.current = confettiRef.current.filter((cf) => {
        cf.life += 1;
        cf.x += cf.vx + Math.sin(cf.life * 0.08) * 0.6;
        cf.y += cf.vy;
        cf.vy += 0.08;
        cf.rot += cf.vRot;
        const alpha = cf.life > cf.maxLife - 35 ? (cf.maxLife - cf.life) / 35 : 0.92;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.translate(cf.x, cf.y);
        ctx.rotate(cf.rot);
        ctx.fillStyle = cf.color;
        ctx.fillRect(-cf.w / 2, -cf.h / 2, cf.w, cf.h);
        ctx.restore();
        return cf.life < cf.maxLife && cf.y < h + 30;
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  /** Interactive Handlers */
  const handleStageClick = (e) => {
    spawnTapMagic(e.clientX, e.clientY);
    if (audioRef.current) audioRef.current.playSparkle();
  };

  const handleTossSprinkles = (e) => {
    if (e) e.stopPropagation();
    if (audioRef.current) audioRef.current.playPop();
    if (e && e.clientX) {
      spawnTapMagic(e.clientX, e.clientY);
    } else if (rootRef.current) {
      spawnTapMagic(rootRef.current.clientWidth / 2, rootRef.current.clientHeight / 2);
    }

    const newBatch = Array.from({ length: 6 }, (_, i) => {
      const tier = Math.floor(Math.random() * 3);
      const xRange = tier === 0 ? [44, 150] : tier === 1 ? [58, 138] : [74, 122];
      const yRange = tier === 0 ? [150, 174] : tier === 1 ? [112, 134] : [78, 96];
      return {
        id: `${Date.now()}-${i}-${Math.random()}`,
        x: xRange[0] + Math.random() * (xRange[1] - xRange[0]),
        y: yRange[0] + Math.random() * (yRange[1] - yRange[0]),
        rot: Math.floor(Math.random() * 180),
        color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
        isHeart: Math.random() > 0.6,
      };
    });

    setExtraSprinkles((prev) => [...prev.slice(-36), ...newBatch]);
  };

  const handleBlowCandles = (e) => {
    if (e) e.stopPropagation();
    if (!candlesLit || blowingOut) return;

    setBlowingOut(true);
    if (audioRef.current) audioRef.current.playBlowOut();
    if (rootRef.current) {
      spawnTapMagic(rootRef.current.clientWidth / 2, rootRef.current.clientHeight * 0.44);
    }

    setTimeout(() => {
      setCandlesLit(false);
    }, 360);

    setTimeout(() => {
      setBlowingOut(false);
    }, 1150);
  };

  const handleToggleSound = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (soundOn) {
      audioRef.current.stop();
      setSoundOn(false);
    } else {
      audioRef.current.start();
      setSoundOn(true);
    }
  };

  const handleReplay = (e) => {
    if (e) e.stopPropagation();
    setShowNoteModal(false);
    setCandlesLit(true);
    setBlowingOut(false);
    setExtraSprinkles([]);
    setSceneIdx(0);
    setIsAutoPlay(true);
    if (audioRef.current) audioRef.current.playPop();
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    if (audioRef.current) audioRef.current.playPop();
    setSceneIdx((prev) => Math.max(0, prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (audioRef.current) audioRef.current.playPop();
    setSceneIdx((prev) => Math.min(SCENES.length - 1, prev + 1));
  };

  const currentScene = SCENES[sceneIdx];

  return (
    <div
      ref={rootRef}
      onClick={handleStageClick}
      className="hbm-root"
      style={{ background: currentScene.bg }}
    >
      {/* Self-Contained Responsive CSS (Zero External Frameworks or Fonts Needed) */}
      <style>{`
        .hbm-root, .hbm-root * {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }

        .hbm-root {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          height: 100dvh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #ffffff;
          user-select: none;
          font-family: ui-rounded, 'Hiragino Maru Gothic ProN', 'Quicksand', 'Nunito', 'Segoe UI', system-ui, -apple-system, sans-serif;
          padding-top: max(8px, env(safe-area-inset-top));
          padding-bottom: max(8px, env(safe-area-inset-bottom));
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
          transition: background 0.9s ease;
        }

        .hbm-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        /* TOP BAR (Compact, shrink-0) */
        .hbm-topbar {
          position: relative;
          z-index: 10;
          flex-shrink: 0;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 4px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .hbm-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          font-size: clamp(11px, 2.2vw, 13px);
          font-weight: 700;
          color: #FFF7D6;
          white-space: nowrap;
        }

        .hbm-dots {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(15, 10, 35, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .hbm-dot {
          border: none;
          padding: 0;
          height: 9px;
          width: 9px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.35);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .hbm-dot:hover {
          background: rgba(255, 255, 255, 0.7);
        }

        .hbm-dot.active {
          width: 24px;
          background: linear-gradient(90deg, #FFB3C6, #FFE599);
          box-shadow: 0 0 10px rgba(255, 229, 153, 0.85);
        }

        .hbm-top-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .hbm-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          height: 34px;
          min-width: 34px;
          padding: 0 10px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.22);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: transform 0.15s ease, background 0.2s ease;
        }

        .hbm-icon-btn:hover {
          background: rgba(255, 255, 255, 0.22);
        }

        .hbm-icon-btn:active {
          transform: scale(0.93);
        }

        .hbm-icon-btn.on {
          background: rgba(255, 179, 198, 0.28);
          border-color: rgba(255, 198, 220, 0.6);
          color: #FFF5D6;
        }

        .hbm-btn-label {
          display: inline;
        }

        /* CENTER STAGE (Flexible, never overflows) */
        .hbm-stage {
          position: relative;
          z-index: 5;
          flex: 1;
          min-height: 0;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px 12px;
        }

        .hbm-svg-stage {
          width: 100%;
          height: 100%;
          max-height: 100%;
          display: block;
          overflow: visible;
        }

        /* BOTTOM STORY & CONTROLS PANEL (Compact, shrink-0) */
        .hbm-footer {
          position: relative;
          z-index: 10;
          flex-shrink: 0;
          width: calc(100% - 24px);
          max-width: 680px;
          margin: 0 auto 8px;
          padding: 12px 16px;
          border-radius: 22px;
          background: rgba(20, 14, 48, 0.68);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 12px 32px rgba(8, 5, 24, 0.45);
          text-align: center;
        }

        .hbm-scene-title {
          margin: 0 0 4px;
          font-size: clamp(14px, 2.8vw, 18px);
          font-weight: 800;
          letter-spacing: 0.3px;
          color: #FFE599;
        }

        .hbm-caption {
          margin: 0 0 10px;
          font-size: clamp(12px, 2.3vw, 14.5px);
          line-height: 1.38;
          font-weight: 600;
          color: rgba(255, 248, 240, 0.94);
        }

        .hbm-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .hbm-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-height: 36px;
          padding: 7px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.26);
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
          font-family: inherit;
          font-size: clamp(12px, 2.3vw, 13.5px);
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.2s ease, opacity 0.2s ease;
        }

        .hbm-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.24);
        }

        .hbm-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .hbm-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .hbm-btn-primary {
          background: linear-gradient(135deg, #FFB3C6 0%, #FFD6A5 55%, #FFE599 100%);
          color: #2E1A47;
          border-color: rgba(255, 255, 255, 0.85);
          box-shadow: 0 4px 18px rgba(255, 179, 198, 0.45);
        }

        .hbm-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #FFC2D1 0%, #FFE0B8 55%, #FFF0B3 100%);
        }

        /* KEEPSAKE BIRTHDAY NOTE MODAL */
        .hbm-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: rgba(12, 8, 28, 0.72);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          animation: hbmFadeIn 0.3s ease;
        }

        .hbm-modal {
          position: relative;
          width: 100%;
          max-width: 440px;
          max-height: 85dvh;
          overflow-y: auto;
          padding: 26px 24px;
          border-radius: 26px;
          background: linear-gradient(180deg, #FFFDF7 0%, #FFF1F6 100%);
          color: #3D254D;
          border: 3px solid #F6C6D5;
          box-shadow: 0 20px 55px rgba(0, 0, 0, 0.5);
          text-align: center;
        }

        .hbm-modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: none;
          background: #FCE2EA;
          color: #C84B76;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .hbm-modal-title {
          margin: 6px 0 8px;
          font-size: clamp(20px, 4.5vw, 26px);
          font-weight: 800;
          color: #542B6E;
        }

        .hbm-modal-divider {
          width: 56px;
          height: 4px;
          border-radius: 999px;
          margin: 0 auto 14px;
          background: linear-gradient(90deg, #FFB3C6, #FFD166);
        }

        .hbm-modal-body {
          margin: 0 0 12px;
          font-size: clamp(13.5px, 2.8vw, 15.5px);
          line-height: 1.55;
          font-weight: 600;
          color: #593B6E;
        }

        .hbm-modal-sign {
          display: inline-block;
          margin-top: 6px;
          padding: 7px 16px;
          border-radius: 999px;
          background: #FFE4ED;
          color: #C43B6D;
          font-size: 13px;
          font-weight: 800;
        }

        /* SVG STORYBOOK ANIMATIONS */
        @keyframes hbmFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes hbmEarLeft {
          0%, 82%, 100% { transform: rotate(0deg); }
          88% { transform: rotate(-10deg); }
          94% { transform: rotate(4deg); }
        }
        @keyframes hbmEarRight {
          0%, 85%, 100% { transform: rotate(0deg); }
          91% { transform: rotate(10deg); }
          96% { transform: rotate(-4deg); }
        }
        @keyframes hbmBlink {
          0%, 92%, 100% { transform: scaleY(1); }
          96% { transform: scaleY(0.1); }
        }
        @keyframes hbmJump {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }
        @keyframes hbmWave {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-18deg); }
        }
        @keyframes hbmWaveLeft {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(18deg); }
        }
        @keyframes hbmFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes hbmCloudDrift {
          0% { transform: translateX(-180px); }
          100% { transform: translateX(880px); }
        }
        @keyframes hbmLanternRise {
          0% { transform: translateY(80px); opacity: 0; }
          15% { opacity: 0.92; }
          85% { opacity: 0.85; }
          100% { transform: translateY(-280px); opacity: 0; }
        }
        @keyframes hbmShootingStar {
          0% { transform: translate(-180px, -90px); opacity: 0; }
          18% { opacity: 1; }
          70% { transform: translate(110px, 35px); opacity: 1; }
          100% { transform: translate(210px, 75px); opacity: 0; }
        }
        @keyframes hbmFlicker {
          0%, 100% { transform: scale(1) rotate(-2deg); }
          50% { transform: scale(1.08, 0.94) rotate(3deg); }
        }
        @keyframes hbmSmoke {
          0% { opacity: 0; transform: translateY(4px) scale(0.75); }
          35% { opacity: 0.85; }
          100% { opacity: 0; transform: translateY(-24px) scale(1.2); }
        }
        @keyframes hbmWind {
          0% { opacity: 0; transform: translateX(-24px); }
          40% { opacity: 0.95; }
          100% { opacity: 0; transform: translateX(36px); }
        }
        @keyframes hbmSprinklePop {
          0% { transform: scale(0) translateY(-10px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes hbmBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2.5px); }
        }
        @keyframes hbmPulse {
          0%, 100% { opacity: 0.65; }
          50% { opacity: 1; }
        }

        .hbm-scene-enter { animation: hbmFadeIn 0.6s ease-out; }
        .hbm-ear-left { animation: hbmEarLeft 3.6s ease-in-out infinite; }
        .hbm-ear-right { animation: hbmEarRight 3.6s ease-in-out infinite; }
        .hbm-blink { animation: hbmBlink 4.2s ease-in-out infinite; }
        .hbm-blink-delayed { animation: hbmBlink 4.8s ease-in-out 1.4s infinite; }
        .hbm-jump { animation: hbmJump 0.85s ease-in-out infinite; }
        .hbm-jump-delayed { animation: hbmJump 0.85s ease-in-out 0.22s infinite; }
        .hbm-wave { animation: hbmWave 0.6s ease-in-out infinite; }
        .hbm-wave-left { animation: hbmWaveLeft 0.6s ease-in-out infinite; }
        .hbm-float { animation: hbmFloat 3.6s ease-in-out infinite; }
        .hbm-cloud-slow { animation: hbmCloudDrift 34s linear infinite; }
        .hbm-cloud-med { animation: hbmCloudDrift 24s linear infinite; }
        .hbm-lantern { animation: hbmLanternRise 7.5s ease-in-out infinite; }
        .hbm-shooting-star { animation: hbmShootingStar 4.4s ease-in-out infinite; }
        .hbm-flicker { animation: hbmFlicker 0.45s ease-in-out infinite; }
        .hbm-smoke { animation: hbmSmoke 1.6s ease-out forwards; }
        .hbm-wind { animation: hbmWind 0.7s ease-out forwards; }
        .hbm-sprinkle-pop { animation: hbmSprinklePop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .hbm-bob { animation: hbmBob 2.4s ease-in-out infinite; }
        .hbm-pulse { animation: hbmPulse 2.2s ease-in-out infinite; }
        .hbm-fairy { animation: hbmPulse 2.4s ease-in-out infinite; }

        /* MOBILE & SHORT LAPTOP RESPONSIVE TIGHTENING */
        @media (max-width: 640px) {
          .hbm-btn-label { display: none; }
          .hbm-icon-btn { padding: 0 8px; }
          .hbm-badge { padding: 5px 10px; }
          .hbm-footer { padding: 10px 12px; border-radius: 18px; margin-bottom: 6px; }
          .hbm-caption { margin-bottom: 8px; }
          .hbm-btn { padding: 6px 11px; min-height: 34px; }
        }

        @media (max-height: 680px) {
          .hbm-topbar { padding: 2px 12px; }
          .hbm-stage { padding: 2px 10px; }
          .hbm-footer { padding: 8px 14px; margin-bottom: 4px; }
          .hbm-scene-title { margin-bottom: 2px; }
          .hbm-caption { margin-bottom: 7px; }
          .hbm-btn { min-height: 32px; padding: 5px 12px; }
        }
      `}</style>

      {/* FULL-SCREEN ANIMATED CANVAS (Stars, Stardust, Tap Hearts, Fireworks & Confetti) */}
      <canvas ref={canvasRef} className="hbm-canvas" />

      {/* ====================================================================
          TOP BAR (Compact Title Badge, Clickable Progress Dots, Audio & Auto-Play)
      ==================================================================== */}
      <header className="hbm-topbar" onClick={(e) => e.stopPropagation()}>
        <div className="hbm-badge">
          <span>For Mantasha ✨</span>
        </div>

        <div className="hbm-dots" role="tablist" aria-label="Storybook Scenes">
          {SCENES.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => {
                if (audioRef.current) audioRef.current.playPop();
                setSceneIdx(sc.id);
              }}
              title={`${sc.id + 1}. ${sc.title}`}
              aria-label={`Scene ${sc.id + 1}: ${sc.title}`}
              className={`hbm-dot ${sc.id === sceneIdx ? 'active' : ''}`}
            />
          ))}
        </div>

        <div className="hbm-top-actions">
          <button
            type="button"
            onClick={() => setIsAutoPlay((p) => !p)}
            className={`hbm-icon-btn ${isAutoPlay ? 'on' : ''}`}
            title={isAutoPlay ? 'Pause Auto-Play' : 'Resume Auto-Play'}
            aria-label={isAutoPlay ? 'Pause Auto-Play' : 'Resume Auto-Play'}
          >
            {isAutoPlay ? <IconPause /> : <IconPlay />}
            <span className="hbm-btn-label">{isAutoPlay ? 'Auto' : 'Paused'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleSound}
            className={`hbm-icon-btn ${soundOn ? 'on' : ''}`}
            title={soundOn ? 'Mute Music Box' : 'Play Music Box'}
            aria-label={soundOn ? 'Mute Music Box' : 'Play Music Box'}
          >
            {soundOn ? <IconMusicOn /> : <IconMusicOff />}
            <span className="hbm-btn-label">{soundOn ? 'Music' : 'Muted'}</span>
          </button>
        </div>
      </header>

      {/* ====================================================================
          CENTER STAGE (Unified 800x500 SVG — Always Scales Cleanly Inside Viewport)
      ==================================================================== */}
      <main className="hbm-stage">
        <svg
          viewBox="0 0 800 500"
          preserveAspectRatio="xMidYMid meet"
          className="hbm-svg-stage"
          role="img"
          aria-label={`Scene ${sceneIdx + 1}: ${currentScene.title}`}
        >
          <defs>
            <radialGradient id="hbmMoonAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF7C2" stopOpacity="0.6" />
              <stop offset="65%" stopColor="#FFE699" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#FFE699" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hbmCandleGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFE599" stopOpacity="0.48" />
              <stop offset="60%" stopColor="#FFB3C6" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#FFB3C6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hbmBakeryGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFE5B4" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#FFE5B4" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="hbmBannerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFE599" />
              <stop offset="50%" stopColor="#FFC6E3" />
              <stop offset="100%" stopColor="#FFF3B0" />
            </linearGradient>
            <linearGradient id="hbmStarTrail" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFE599" stopOpacity="0" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Drifting Pastel Clouds (Outdoor Night Scenes) */}
          {sceneIdx !== 1 && (
            <g opacity="0.32">
              <g className="hbm-cloud-slow">
                <path
                  d="M30,115 Q15,115 15,100 Q15,85 32,83 Q42,61 68,65 Q88,53 112,69 Q134,63 148,81 Q172,83 172,101 Q172,115 154,115 Z"
                  fill="#E5D4FF"
                />
              </g>
              <g className="hbm-cloud-med" style={{ animationDelay: '-12s' }}>
                <path
                  d="M120,170 Q108,170 108,158 Q108,146 122,144 Q130,128 150,131 Q166,121 185,134 Q202,129 213,143 Q232,145 232,159 Q232,170 218,170 Z"
                  fill="#FFD6E8"
                />
              </g>
            </g>
          )}

          {/* Glowing Smiling Moon (Outdoor Night Scenes) */}
          {sceneIdx !== 1 && <MoonGroup x={655} y={18} scale={0.95} />}

          {/* ----------------------------------------------------------------
              SCENE 1: "A Starry Secret"
          ---------------------------------------------------------------- */}
          {sceneIdx === 0 && (
            <g key="sc0" className="hbm-scene-enter">
              {/* Shooting Star Streaking Across the Sky */}
              <g className="hbm-shooting-star">
                <line x1="170" y1="88" x2="310" y2="128" stroke="url(#hbmStarTrail)" strokeWidth="4" strokeLinecap="round" />
                <polygon
                  points="314,118 318,127 328,129 319,134 321,144 313,138 304,143 307,133 299,127 309,126"
                  fill="#FFF7C2"
                />
              </g>

              {/* Floating Glowing Sealed Envelope */}
              <g className="hbm-float">
                <g transform="translate(352, 138)">
                  <ellipse cx="48" cy="36" rx="58" ry="42" fill="url(#hbmCandleGlow)" />
                  <rect x="10" y="10" width="76" height="52" rx="10" fill="#FFF7E6" stroke="#FFFFFF" strokeWidth="2.5" />
                  <polyline points="12,14 48,42 84,14" fill="none" stroke="#F4A4B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Little Heart Seal */}
                  <path
                    d="M48,38 c -3,-4 -9,-1.5 -9,3 c 0,4.5 9,9.5 9,9.5 c 0,0 9,-5 9,-9.5 c 0,-4.5 -6,-7 -9,-3 z"
                    fill="#FF5C8A"
                  />
                  {/* Label Pill */}
                  <rect x="-2" y="70" width="100" height="22" rx="11" fill="rgba(18, 12, 42, 0.45)" />
                  <text x="48" y="85" textAnchor="middle" fill="#FFF3B0" fontSize="11.5" fontWeight="700">
                    For Mantasha ✨
                  </text>
                </g>
              </g>

              {/* Rolling Pastel Twilight Meadow Hills */}
              <path d="M0,370 Q210,300 430,360 T800,340 L800,500 L0,500 Z" fill="#372B63" opacity="0.78" />
              <path d="M0,400 Q260,340 500,395 T800,385 L800,500 L0,500 Z" fill="#4C3B7E" />
              <path d="M0,435 Q300,385 560,435 T800,425 L800,500 L0,500 Z" fill="#5E4D94" />

              {/* Bunny Sitting on Hill Watching the Star */}
              <BunnyGroup x={324} y={295} scale={1.08} />
            </g>
          )}

          {/* ----------------------------------------------------------------
              SCENE 2: "Baking Something Sweet"
          ---------------------------------------------------------------- */}
          {sceneIdx === 1 && (
            <g key="sc1" className="hbm-scene-enter">
              <FairyLightsGroup y={6} />
              <circle cx="400" cy="280" r="210" fill="url(#hbmBakeryGlow)" />

              {/* Cozy Bakery Wooden Table */}
              <rect x="65" y="420" width="670" height="26" rx="13" fill="#E8B896" stroke="#FFF1E6" strokeWidth="2" />
              <rect x="95" y="446" width="610" height="54" fill="#C9926E" opacity="0.85" />

              {/* Bunny & Chef Bear Decorating the Cake */}
              <BunnyGroup x={145} y={258} scale={1.06} waving />
              <BearGroup x={505} y={258} scale={1.06} chefHat waving />

              {/* Interactive 3-Tier Pastel Strawberry Cake */}
              <CakeGroup
                x={290}
                y={228}
                scale={1.1}
                extraSprinkles={extraSprinkles}
                onClick={handleTossSprinkles}
              />

              {/* Subtle Interactive Hint Above Cake */}
              <g className="hbm-bob" onClick={handleTossSprinkles} style={{ cursor: 'pointer' }}>
                <rect x="302" y="130" width="196" height="32" rx="16" fill="rgba(255, 179, 198, 0.25)" stroke="rgba(255, 214, 232, 0.6)" strokeWidth="1.5" />
                <text x="400" y="151" textAnchor="middle" fill="#FFF7E6" fontSize="13" fontWeight="700">
                  ✨ Tap Cake for Sprinkles!
                </text>
              </g>
            </g>
          )}

          {/* ----------------------------------------------------------------
              SCENE 3: "Up, Up & Away"
          ---------------------------------------------------------------- */}
          {sceneIdx === 2 && (
            <g key="sc2" className="hbm-scene-enter">
              {/* Rising Glowing Paper Sky Lanterns */}
              {[
                { lx: 110, ly: 390, delay: '0s', sc: 1 },
                { lx: 210, ly: 430, delay: '2.2s', sc: 0.78 },
                { lx: 610, ly: 400, delay: '1.1s', sc: 0.95 },
                { lx: 700, ly: 440, delay: '3.4s', sc: 0.82 },
              ].map((lan, i) => (
                <g key={i} transform={`translate(${lan.lx}, ${lan.ly}) scale(${lan.sc})`}>
                  <g className="hbm-lantern" style={{ animationDelay: lan.delay }}>
                    <ellipse cx="16" cy="22" rx="24" ry="28" fill="#FFE599" opacity="0.22" />
                    <rect x="4" y="2" width="24" height="32" rx="8" fill="#FFD166" stroke="#FFF3B0" strokeWidth="1.5" />
                    <rect x="9" y="26" width="14" height="6" rx="2" fill="#FFF8D6" />
                  </g>
                </g>
              ))}

              {/* Bobbing Pastel Balloon Bouquet + Cozy Basket */}
              <g className="hbm-float">
                {/* Strings */}
                <g stroke="rgba(255,255,255,0.65)" strokeWidth="1.8">
                  <line x1="305" y1="150" x2="355" y2="320" />
                  <line x1="350" y1="120" x2="375" y2="320" />
                  <line x1="400" y1="108" x2="400" y2="320" />
                  <line x1="450" y1="120" x2="425" y2="320" />
                  <line x1="495" y1="150" x2="445" y2="320" />
                </g>

                {/* 5 Pastel Balloons */}
                <g>
                  <ellipse cx="305" cy="130" rx="34" ry="42" fill="#FFB3C6" />
                  <ellipse cx="294" cy="116" rx="7" ry="13" fill="#FFFFFF" opacity="0.38" />

                  <ellipse cx="495" cy="130" rx="34" ry="42" fill="#A0C4FF" />
                  <ellipse cx="484" cy="116" rx="7" ry="13" fill="#FFFFFF" opacity="0.38" />

                  <ellipse cx="350" cy="102" rx="36" ry="44" fill="#BDB2FF" />
                  <ellipse cx="338" cy="88" rx="7" ry="13" fill="#FFFFFF" opacity="0.38" />

                  <ellipse cx="450" cy="102" rx="36" ry="44" fill="#CAFFBF" />
                  <ellipse cx="438" cy="88" rx="7" ry="13" fill="#FFFFFF" opacity="0.38" />

                  <ellipse cx="400" cy="88" rx="38" ry="46" fill="#FDFFB6" />
                  <ellipse cx="387" cy="72" rx="8" ry="14" fill="#FFFFFF" opacity="0.45" />
                </g>

                {/* Passengers Peeking Out of the Basket */}
                <BunnyGroup x={295} y={248} scale={0.75} waving />
                <BearGroup x={402} y={248} scale={0.75} />
                <CakeGroup x={346} y={266} scale={0.5} />
                <GiftBoxGroup x={410} y={294} scale={0.55} />

                {/* Cozy Woven Basket */}
                <rect x="315" y="340" width="170" height="72" rx="22" fill="#D59E6E" stroke="#F7DEC2" strokeWidth="3" />
                <line x1="322" y1="362" x2="478" y2="362" stroke="#A66E42" strokeWidth="2.5" opacity="0.55" />
                <line x1="320" y1="382" x2="480" y2="382" stroke="#A66E42" strokeWidth="2.5" opacity="0.55" />
                <line x1="328" y1="400" x2="472" y2="400" stroke="#A66E42" strokeWidth="2.5" opacity="0.55" />
              </g>
            </g>
          )}

          {/* ----------------------------------------------------------------
              SCENE 4: "Make a Wish, Mantasha!"
          ---------------------------------------------------------------- */}
          {sceneIdx === 3 && (
            <g key="sc3" className="hbm-scene-enter">
              <BuntingGroup />
              <FairyLightsGroup y={22} />

              {/* Hilltop Meadow */}
              <path d="M0,415 Q400,340 800,415 L800,500 L0,500 Z" fill="#4D3A7F" />
              <path d="M0,445 Q400,385 800,445 L800,500 L0,500 Z" fill="#614C96" />

              {/* Cheering Bunny & Bear with Party Hats */}
              <BunnyGroup x={145} y={262} scale={1.06} partyHat waving={!candlesLit} />
              <BearGroup x={505} y={262} scale={1.06} partyHat waving={!candlesLit} />

              {/* Interactive Glowing Birthday Cake with 5 Candles */}
              <CakeGroup
                x={288}
                y={224}
                scale={1.12}
                showCandles
                candlesLit={candlesLit}
                blowingOut={blowingOut}
                extraSprinkles={extraSprinkles}
                onClick={handleBlowCandles}
              />

              {/* Floating Prompt */}
              {candlesLit ? (
                <g className="hbm-bob" onClick={handleBlowCandles} style={{ cursor: 'pointer' }}>
                  <rect x="275" y="128" width="250" height="34" rx="17" fill="rgba(255, 229, 153, 0.22)" stroke="rgba(255, 229, 153, 0.65)" strokeWidth="1.5" />
                  <text x="400" y="150" textAnchor="middle" fill="#FFF7D6" fontSize="13.5" fontWeight="700">
                    🎂 Tap the Cake to Blow Candles!
                  </text>
                </g>
              ) : (
                <g className="hbm-scene-enter">
                  <rect x="285" y="128" width="230" height="34" rx="17" fill="rgba(202, 255, 191, 0.22)" stroke="rgba(202, 255, 191, 0.65)" strokeWidth="1.5" />
                  <text x="400" y="150" textAnchor="middle" fill="#E8FFDF" fontSize="13.5" fontWeight="700">
                    ✨ Wish Sent to the Stars! ✨
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ----------------------------------------------------------------
              SCENE 5: "Happy Birthday Mantasha!" (Grand Finale)
          ---------------------------------------------------------------- */}
          {sceneIdx === 4 && (
            <g key="sc4" className="hbm-scene-enter">
              <BuntingGroup />
              <FairyLightsGroup y={20} />

              {/* Glowing Birthday Banner */}
              <g className="hbm-bob">
                <rect x="115" y="96" width="570" height="74" rx="37" fill="rgba(255, 255, 255, 0.1)" stroke="rgba(255, 229, 153, 0.45)" strokeWidth="2" />
                <text
                  x="400"
                  y="144"
                  textAnchor="middle"
                  fill="url(#hbmBannerGrad)"
                  fontSize="37"
                  fontWeight="900"
                  letterSpacing="0.8"
                >
                  Happy Birthday Mantasha!
                </text>
              </g>

              {/* Hilltop Ground */}
              <path d="M0,425 Q400,355 800,425 L800,500 L0,500 Z" fill="#523C87" />

              {/* Jumping Bunny, Popped Open Gift Box, Cake & Jumping Bear */}
              <BunnyGroup x={92} y={265} scale={1.04} partyHat happyJump waving />
              <GiftBoxGroup x={235} y={322} scale={1.08} open />
              <CakeGroup x={358} y={256} scale={0.92} showCandles candlesLit={false} extraSprinkles={extraSprinkles} />
              <BearGroup x={556} y={265} scale={1.04} partyHat happyJump waving />
            </g>
          )}
        </svg>
      </main>

      {/* ====================================================================
          BOTTOM STORY & CONTROLS PANEL (Compact, Responsive Frosted Glass Card)
      ==================================================================== */}
      <footer className="hbm-footer" onClick={(e) => e.stopPropagation()}>
        <h2 className="hbm-scene-title">{currentScene.title}</h2>
        <p className="hbm-caption">{currentScene.caption}</p>

        <div className="hbm-controls">
          {/* Previous Scene Button (Scenes 1–4) */}
          {sceneIdx < 4 && (
            <button
              type="button"
              onClick={handlePrev}
              disabled={sceneIdx === 0}
              className="hbm-btn"
              aria-label="Previous Scene"
            >
              <IconChevronLeft />
              <span>Prev</span>
            </button>
          )}

          {/* Scene-Specific Interactive Action Button */}
          {sceneIdx === 1 && (
            <button type="button" onClick={handleTossSprinkles} className="hbm-btn hbm-btn-primary">
              <span>Add Sprinkles ✨</span>
            </button>
          )}

          {sceneIdx === 3 && candlesLit && (
            <button
              type="button"
              onClick={handleBlowCandles}
              disabled={blowingOut}
              className="hbm-btn hbm-btn-primary"
            >
              <span>Make a Wish &amp; Blow Candles 🎂</span>
            </button>
          )}

          {sceneIdx === 3 && !candlesLit && (
            <button type="button" onClick={handleNext} className="hbm-btn hbm-btn-primary">
              <span>Open Your Surprise! 🎁</span>
            </button>
          )}

          {/* Scene 5 Grand Finale Controls */}
          {sceneIdx === 4 && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (audioRef.current) audioRef.current.playSparkle();
                  setShowNoteModal(true);
                }}
                className="hbm-btn hbm-btn-primary"
              >
                <span>Open Birthday Note 💌</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  launchCelebrationBurst(3);
                  if (audioRef.current) audioRef.current.playCelebration();
                }}
                className="hbm-btn"
              >
                <span>Celebrate More! 🎉</span>
              </button>

              <button type="button" onClick={handleReplay} className="hbm-btn">
                <span>Replay Story ↺</span>
              </button>
            </>
          )}

          {/* Next Scene Button (Scenes 1–3, or Scene 4 if skipping) */}
          {sceneIdx < 4 && !(sceneIdx === 3 && !candlesLit) && (
            <button type="button" onClick={handleNext} className="hbm-btn" aria-label="Next Scene">
              <span>Next</span>
              <IconChevronRight />
            </button>
          )}
        </div>
      </footer>

      {/* ====================================================================
          KEEPSAKE BIRTHDAY NOTE MODAL (Scrollable inside 85dvh on small screens)
      ==================================================================== */}
      {showNoteModal && (
        <div
          className="hbm-modal-backdrop"
          onClick={(e) => {
            e.stopPropagation();
            setShowNoteModal(false);
          }}
        >
          <div className="hbm-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="hbm-modal-close"
              onClick={() => setShowNoteModal(false)}
              aria-label="Close Birthday Note"
            >
              <IconClose />
            </button>

            <div style={{ fontSize: '30px', marginBottom: '2px' }}></div>
            <h3 className="hbm-modal-title">Dear Mantasha,</h3>
            <div className="hbm-modal-divider" />

            <p className="hbm-modal-body">
              Happy Birthday! Wishing you a beautiful year ahead filled with laughter, 
              lovely surprises, unforgettable memories, and countless little moments that make you smile..
            </p>
            <p className="hbm-modal-body">
              Never stop shining as brightly as you do — the world is so much
              sweeter with you in it!
            </p>

            <div className="hbm-modal-sign">Again Happy Birthday  ✨</div>
          </div>
        </div>
      )}
    </div>
  );
}