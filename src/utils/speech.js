/**
 * Web Speech API Audio Narration Controller
 * Provides hands-free audio guide playback for the generated cultural story.
 */

class SpeechController {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.listeners = new Set();
  }

  isSupported() {
    return Boolean(this.synth && typeof window.SpeechSynthesisUtterance !== 'undefined');
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(state) {
    this.listeners.forEach((fn) => fn(state));
  }

  speak(text, onEndCallback = null) {
    if (!this.isSupported() || !text) return false;

    // Cancel any active speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    // Configure voice properties for natural narration
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Pick best available English voice
    const voices = this.synth.getVoices();
    const naturalVoice = voices.find(
      (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.lang.startsWith('en'))
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      this.notify({ isPlaying: true, isPaused: false });
    };

    utterance.onend = () => {
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.notify({ isPlaying: false, isPaused: false });
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.notify({ isPlaying: false, isPaused: false, error: e });
    };

    this.synth.speak(utterance);
    return true;
  }

  pause() {
    if (this.synth && this.isPlaying && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
      this.notify({ isPlaying: true, isPaused: true });
    }
  }

  resume() {
    if (this.synth && this.isPlaying && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
      this.notify({ isPlaying: true, isPaused: false });
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      this.notify({ isPlaying: false, isPaused: false });
    }
  }

  toggle(text) {
    if (this.isPlaying) {
      if (this.isPaused) {
        this.resume();
      } else {
        this.pause();
      }
    } else {
      this.speak(text);
    }
  }
}

export const speechService = new SpeechController();
