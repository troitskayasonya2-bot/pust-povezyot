import { clips, musicLoop } from './sound-map.js?v=2';

// Sound never holds up the game: a late or missing file only means silence.
const musicLevel = { calm: .5, machine: .3, suspense: .05, reveal: .36 };
const AudioEngine = window.AudioContext || window.webkitAudioContext;

export function createSound() {
  const files = {};
  const buffers = {};
  const listeners = new Set();
  let voices = [];
  let context;
  let master;
  let musicBus;
  let effectsBus;
  let music;
  let muted = false;
  let mood = 'calm';

  // A failed download is forgotten, so the next gesture tries again.
  function bytes(name) {
    files[name] ??= fetch(new URL(`audio/${name}.mp3?v=2`, import.meta.url))
      .then(response => (response.ok ? response.arrayBuffer() : Promise.reject(new Error(response.status))))
      .catch(() => { delete files[name]; return null; });
    return files[name];
  }

  const decoding = {};
  function decode(name) {
    decoding[name] ??= bytes(name)
      .then(data => data && new Promise((resolve, reject) => {
        // Safari takes callbacks, newer browsers also return a promise; both must be handled.
        context.decodeAudioData(data.slice(0), resolve, reject)?.catch(reject);
      }))
      .then(buffer => {
        if (buffer) buffers[name] = buffer;
        else delete decoding[name];
      }, () => { delete decoding[name]; });
    return decoding[name];
  }

  function startMusic() {
    if (music || muted || !buffers.music) return;
    music = context.createBufferSource();
    music.buffer = buffers.music;
    music.loop = true;
    Object.assign(music, musicLoop);
    music.connect(musicBus);
    music.start(0, musicLoop.loopStart);
  }

  function unlock() {
    if (!AudioEngine || muted) return;
    try {
      if (!context) {
        context = new AudioEngine();
        master = context.createGain();
        musicBus = context.createGain();
        effectsBus = context.createGain();
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -8;
        limiter.ratio.value = 6;
        musicBus.gain.value = musicLevel[mood];
        musicBus.connect(master);
        effectsBus.connect(master);
        master.connect(limiter);
        limiter.connect(context.destination);
      }
      if (context.state !== 'running') {
        context.resume().catch(() => {});
        // Older iOS only opens the output for a sound started inside the gesture.
        const blank = context.createBufferSource();
        blank.buffer = context.createBuffer(1, 1, 22050);
        blank.connect(context.destination);
        blank.start();
      }
      decode('machine');
      decode('music').then(startMusic);
    } catch {
      // No audio device: the game continues silently.
    }
  }

  function play(name, { delay = 0, volume = 1 } = {}) {
    if (muted || !context || !clips[name]) return;
    const asked = performance.now();
    const [file, start, length] = clips[name];

    const begin = () => {
      if (muted || !buffers[file] || context.state === 'closed') return;
      const late = Math.max(0, (performance.now() - asked) / 1000);
      // A short sound that missed its moment is skipped; a long one joins in step.
      const joins = length >= 2 && file === 'machine';
      const patience = name.startsWith('toy-') ? 1.5 : .5;
      if (joins ? late > length - .3 : late > patience) return;
      const skip = joins && late > .08 ? late : 0;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffers[file];
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(effectsBus);
      source.start(context.currentTime + delay, start + skip, length - skip);
      const voice = { name, source, gain };
      voices.push(voice);
      source.onended = () => {
        voices = voices.filter(item => item !== voice);
        source.disconnect();
        gain.disconnect();
      };
    };

    if (buffers[file] && context.state === 'running') begin();
    else Promise.all([decode(file), context.resume()]).then(begin, () => {});
  }

  // Leaving a screen takes its long sounds with it.
  function settle() {
    if (!context) return;
    for (const { name, source, gain } of voices) {
      if (['tap', 'coin', 'open'].includes(name)) continue;
      gain.gain.setTargetAtTime(0, context.currentTime, .035);
      try { source.stop(context.currentTime + .2); } catch { /* already over */ }
    }
  }

  function setMood(next) {
    mood = next;
    if (context) musicBus.gain.setTargetAtTime(musicLevel[mood], context.currentTime, mood === 'suspense' ? .12 : .4);
  }

  function setMuted(value) {
    muted = value;
    if (muted && context) master.gain.setTargetAtTime(0, context.currentTime, .025);
    if (!muted) {
      unlock();
      if (context) master.gain.setTargetAtTime(1, context.currentTime, .025);
    }
    for (const listener of listeners) listener(muted);
  }

  document.addEventListener('visibilitychange', () => {
    if (!context) return;
    if (document.hidden) context.suspend().catch(() => {});
    else if (!muted) context.resume().catch(() => {});
  });

  function preload() {
    if (navigator.connection?.saveData) return;
    bytes('machine');
    bytes('music');
  }

  // The toy is known seven seconds before it is seen.
  function prepare(name) {
    if (muted || !clips[name]) return;
    const [file] = clips[name];
    if (context) decode(file);
    else bytes(file);
  }

  return {
    unlock, play, settle, setMood, setMuted, preload, prepare,
    get muted() { return muted; },
    get state() { return { context: context?.state ?? 'none', effects: !!buffers.machine, music: !!music, mood, muted }; },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}
