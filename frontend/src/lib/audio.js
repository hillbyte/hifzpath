import { audioState } from './stores.js';

let audioEl = null;
let updateInterval = null;

// Create or reuse the global audio element for playback
function getAudio() {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.addEventListener('ended', () => {
      audioState.update((s) => {
        if (s.loop) {
          audioEl.currentTime = 0;
          audioEl.play();
          return { ...s, playing: true };
        }
        clearInterval(updateInterval);
        return { ...s, playing: false, progress: 0 };
      });
    });
    audioEl.addEventListener('loadedmetadata', () => {
      audioState.update((s) => ({ ...s, duration: audioEl.duration }));
    });
  }
  return audioEl;
}

function startTracking() {
  clearInterval(updateInterval);
  updateInterval = setInterval(() => {
    if (audioEl) {
      audioState.update((s) => ({
        ...s,
        progress: audioEl.currentTime,
        duration: audioEl.duration || 0,
      }));
    }
  }, 100);
}

// Start playing an audio file
export function playAudio(url) {
  const audio = getAudio();
  if (audio.src !== url) {
    audio.src = url;
  }
  audio.play();
  audioState.update((s) => ({ ...s, playing: true }));
  startTracking();
}

// Pause the current audio
export function pauseAudio() {
  if (audioEl) {
    audioEl.pause();
    clearInterval(updateInterval);
    audioState.update((s) => ({ ...s, playing: false }));
  }
}

// Toggle between play and pause
export function togglePlay(url) {
  if (audioEl && audioEl.src && !audioEl.paused) {
    pauseAudio();
  } else {
    playAudio(url);
  }
}

// Toggle looping for the current track
export function toggleLoop() {
  audioState.update((s) => {
    const newLoop = !s.loop;
    if (audioEl) audioEl.loop = newLoop;
    return { ...s, loop: newLoop };
  });
}

// Change the playback speed (e.g. 1.0x, 1.5x)
export function setSpeed(speed) {
  if (audioEl) audioEl.playbackRate = speed;
  audioState.update((s) => ({ ...s, speed }));
}

// Jump to a specific fraction of the audio (0 to 1)
export function seekTo(fraction) {
  if (audioEl && audioEl.duration) {
    audioEl.currentTime = fraction * audioEl.duration;
  }
}

// Stop playback completely and reset the audio state
export function stopAudio() {
  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
    clearInterval(updateInterval);
  }
  audioState.set({ playing: false, loop: false, speed: 1, progress: 0, duration: 0 });
}
