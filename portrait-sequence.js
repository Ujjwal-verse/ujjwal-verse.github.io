'use strict';

// The exact uploaded portrait anchors the front view. Matching angle images
// provide the turn; two decoded frames blend at each scroll position.
window.createPortraitSequence = function ({figure, reducedMotion, onReady}) {
  const canvas = figure.querySelector('canvas');
  const context = canvas.getContext('2d', {alpha: false});
  const source = figure.querySelector('img');
  const frames = [];
  let ready = false;
  let loading = false;
  let previousPosition = -1;
  if (!context) return {load() {}, render() {}};

  function fit(image) {
    const isOriginal = image === frames[0];
    const cropScale = isOriginal ? 1.15 : 1;
    const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight) * cropScale;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const y = isOriginal ? (canvas.height - height) * .1 : (canvas.height - height) / 2;
    context.drawImage(image, (canvas.width - width) / 2, y, width, height);
  }

  function render(progress) {
    if (!ready || reducedMotion()) return;
    // Front -> three-quarter/profile -> front, under the visitor's scroll.
    // Small holds at both ends let the chosen original remain the main photo.
    const phase = Math.max(0, Math.min(1, (progress - .07) / .77));
    const turn = Math.sin(Math.PI * phase);
    const rawPosition = turn * (frames.length - 1);
    const position = rawPosition < .005 ? 0 : rawPosition;
    if (position === previousPosition || (position !== 0 && Math.abs(position - previousPosition) < .002)) return;
    previousPosition = position;
    const lower = Math.floor(position);
    const upper = Math.min(lower + 1, frames.length - 1);
    context.globalAlpha = 1;
    fit(frames[lower]);
    if (upper !== lower && position > lower) {
      context.globalAlpha = position - lower;
      fit(frames[upper]);
      context.globalAlpha = 1;
    }
    figure.classList.add('portrait-ready');
  }

  async function load() {
    if (ready || loading || reducedMotion()) return;
    loading = true;
    try {
      const paths = [source.getAttribute('src'), ...Array.from({length: 8}, (_, index) => `assets/portrait-turn-${String(index + 1).padStart(2, '0')}.webp`)];
      const decoded = await Promise.all(paths.map(async path => {
        const image = new Image();
        image.src = path;
        await image.decode();
        return image;
      }));
      frames.push(...decoded);
      ready = true;
      onReady();
    } catch {
      // Retain the selected original if a frame cannot be fetched or decoded.
      figure.classList.remove('portrait-ready');
      loading = false;
    }
  }
  return {load, render};
};
