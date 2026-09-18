'use strict';

const projects = window.portfolioProjects;
const dialog = document.querySelector('.project-dialog');
const closeButton = document.querySelector('.dialog-close');
const imageWrap = document.querySelector('.dialog-image-wrap');
const dialogImage = document.querySelector('.dialog-image');
let projectTrigger = null;

function openProject(key, trigger) {
  const project = projects[key];
  if (!project) return;
  projectTrigger = trigger;
  document.querySelector('#dialog-title').textContent = project.name;
  document.querySelector('.dialog-category').textContent = project.category;
  document.querySelector('#dialog-description').textContent = project.description;
  document.querySelector('.dialog-exploration').textContent = project.exploration;
  document.querySelector('.dialog-stack').replaceChildren(...project.tools.map(tool => {
    const tag = document.createElement('span');
    tag.textContent = tool;
    return tag;
  }));
  imageWrap.hidden = !project.image;
  if (project.image) {
    dialogImage.src = project.image;
    dialogImage.alt = project.imageAlt;
    imageWrap.querySelector('figcaption').textContent = project.imageCaption;
  } else {
    dialogImage.removeAttribute('src');
    dialogImage.alt = '';
  }
  dialog.showModal();
  dialog.scrollTop = 0;
  document.body.classList.add('dialog-open');
  closeButton.focus();
}

document.querySelectorAll('[data-project]').forEach(button => {
  button.addEventListener('click', () => openProject(button.dataset.project, button));
});
closeButton.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  projectTrigger?.focus({ preventScroll: true });
});

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionButton = document.querySelector('.motion-control');
const hero = document.querySelector('.hero-scene');
const heroSticky = document.querySelector('.hero-sticky');
const heroContent = document.querySelector('.hero-content');
const portrait = document.querySelector('.hero-portrait');
const sceneCounter = document.querySelector('.scene-counter');
const heroRole = document.querySelector('.hero-role');
const satellitePdf = document.querySelector('.satellite-pdf');
const satelliteReel = document.querySelector('.satellite-reel');
const heroArt = document.querySelector('.hero-art');
const cinema = document.querySelector('.work-cinema');
const cinemaSticky = document.querySelector('.cinema-sticky');
const camera = document.querySelector('.gallery-camera');
const depthCards = [...document.querySelectorAll('.depth-card')];
const count = document.querySelector('.cinema-count strong');
const activeName = document.querySelector('.cinema-active-name');
const cinemaProgress = document.querySelector('.cinema-progress span');
const previous = document.querySelector('.gallery-prev');
const next = document.querySelector('.gallery-next');
const progressBar = document.querySelector('.reading-progress');
const animatedHero = [heroContent, portrait, satellitePdf, satelliteReel, heroArt];
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
let motionPaused = motionQuery.matches;
let frameId = 0;
let currentIndex = 0;
let pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
let observer;
let portraitProgress = 0;
let portraitTarget = 0;
const portraitSequence = window.createPortraitSequence({
  figure: portrait,
  reducedMotion: () => motionPaused || motionQuery.matches,
  onReady: scheduleFrame
});

function plainGallery() {
  return motionPaused || motionQuery.matches || (window.innerHeight <= 650 && window.innerWidth > 700);
}

function resetScenes() {
  animatedHero.forEach(el => { el.style.transform = ''; el.style.opacity = ''; });
  [satellitePdf, satelliteReel].forEach(el => { el.style.visibility = ''; el.style.pointerEvents = ''; el.tabIndex = -1; });
  depthCards.forEach(card => {
    card.style.transform = '';
    card.style.opacity = '';
    card.style.visibility = '';
    card.style.pointerEvents = '';
    card.removeAttribute('aria-hidden');
    card.tabIndex = 0;
  });
}

function applyMotion() {
  document.body.classList.toggle('motion-off', motionPaused);
  document.documentElement.style.scrollBehavior = motionPaused ? 'auto' : '';
  motionButton.setAttribute('aria-pressed', String(motionPaused));
  motionButton.querySelector('.motion-label').textContent = motionPaused ? 'Motion paused' : 'Pause motion';
  motionButton.querySelector('span:first-child').textContent = motionPaused ? '▶' : 'Ⅱ';
  motionButton.setAttribute('aria-label', motionPaused ? 'Resume animation' : 'Pause animation');
  if (motionPaused) {
    resetScenes();
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }
  if (!motionPaused) portraitSequence.load();
  scheduleFrame();
}

motionButton.addEventListener('click', () => {
  const sections = [...document.querySelectorAll('main > section')];
  const anchor = sections.find(section => {
    const bounds = section.getBoundingClientRect();
    return bounds.top <= 100 && bounds.bottom > 100;
  });
  const oldTop = anchor?.getBoundingClientRect().top ?? 0;
  const isScene = anchor === hero || anchor === cinema;
  motionPaused = !motionPaused;
  applyMotion();
  if (anchor) {
    const target = window.scrollY + anchor.getBoundingClientRect().top - (isScene ? 0 : oldTop);
    window.scrollTo({top: target, behavior: 'instant'});
  }
});
motionQuery.addEventListener('change', event => {
  motionPaused = event.matches;
  applyMotion();
});

function setActive(index) {
  if (index !== currentIndex) {
    currentIndex = index;
    count.textContent = String(index + 1).padStart(2, '0');
    activeName.textContent = projects[depthCards[index].dataset.project].name;
  }
  previous.disabled = index === 0;
  next.disabled = index === depthCards.length - 1;
}

function renderFrame() {
  frameId = 0;
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const pageRange = document.documentElement.scrollHeight - viewportHeight;
  progressBar.style.transform = `scaleX(${pageRange > 0 ? clamp(window.scrollY / pageRange) : 0})`;
  const mobile = viewportWidth <= 700;
  let heroActive = false;
  pointer.x += (pointer.targetX - pointer.x) * .09;
  pointer.y += (pointer.targetY - pointer.y) * .09;

  if (!motionPaused && !motionQuery.matches) {
    const bounds = hero.getBoundingClientRect();
    if (bounds.bottom > 0 && bounds.top < viewportHeight) {
      heroActive = true;
      const heroRange = Math.max(1, hero.offsetHeight - heroSticky.offsetHeight);
      const rawProgress = clamp(-bounds.top / heroRange);
      portraitTarget = rawProgress;
      portraitProgress += (portraitTarget - portraitProgress) * .16;
      if (Math.abs(portraitTarget - portraitProgress) < .0005) portraitProgress = portraitTarget;
      const p = portraitProgress;
      portraitSequence.render(p);
      const px = mobile ? 0 : pointer.x;
      const py = mobile ? 0 : pointer.y;
      // The image sequence turns the person; camera movement adds subtle depth.
      const enter = clamp((p - .64) / .32);
      const fade = clamp((p - .8) / .2);
      portrait.style.transform = `translate3d(${px * -9 - p * (mobile ? 15 : 60)}px,${py * -5 - p * 22}px,0) rotateY(${px * 2.2}deg) scale(${1 + p * .07})`;
      portrait.style.opacity = String(1 - fade * .75);
      satellitePdf.style.transform = `translate3d(${-enter * (mobile ? 12 : 32)}px,${(1 - enter) * 170}px,${enter * 65}px) rotateY(${22 - enter * 32 + px * 4}deg) rotateZ(${-9 + enter * 3}deg)`;
      satelliteReel.style.transform = `translate3d(${enter * 15}px,${(1 - enter) * 200}px,${enter * 30}px) rotateY(${-25 + enter * 32 - px * 4}deg) rotateZ(${12 - enter * 6}deg)`;
      [satellitePdf, satelliteReel].forEach(el => {
        el.style.opacity = String(enter);
        el.style.visibility = enter > .03 ? 'visible' : 'hidden';
        el.style.pointerEvents = enter > .65 ? 'auto' : 'none';
        el.tabIndex = enter > .65 ? 0 : -1;
      });
      heroContent.style.transform = `translate3d(${-p * (mobile ? 0 : 22)}px,${-p * (mobile ? 5 : 30)}px,0)`;
      heroArt.style.transform = `translateY(${-p * 30}px) rotate(${p * 20 + px * 2}deg) scale(${.8 + p * .4})`;
      heroArt.style.opacity = String(fade * .38);
      const chapter = Math.min(2, Math.floor(p * 3));
      sceneCounter.firstChild.textContent = `0${chapter + 1} `;
      const roles = ['AI & DATA SCIENCE', 'CODE & CREATIVITY', 'IDEAS INTO EXPERIENCES'];
      heroRole.textContent = roles[chapter];
    }
  }

  if (plainGallery()) {
    depthCards.forEach(card => {
      card.style.transform = '';
      card.style.opacity = '1';
      card.style.visibility = 'visible';
      card.style.pointerEvents = '';
      card.removeAttribute('aria-hidden');
      card.tabIndex = 0;
    });
  } else {
    const bounds = cinema.getBoundingClientRect();
    if (bounds.bottom > -viewportHeight && bounds.top < viewportHeight * 2) {
      const range = Math.max(1, cinema.offsetHeight - cinemaSticky.offsetHeight);
      const p = clamp(-bounds.top / range);
      const position = p * (depthCards.length - 1);
      setActive(Math.round(position));
      const stride = viewportWidth * (mobile ? .83 : .48);
      depthCards.forEach((card, index) => {
        const distance = index - position;
        const abs = Math.abs(distance);
        const x = distance * stride;
        const y = abs * (mobile ? 6 : 25);
        const z = -abs * (mobile ? 230 : 350);
        const rotation = clamp(-distance * (mobile ? 25 : 32), -65, 65);
        card.style.visibility = abs < 2.2 ? 'visible' : 'hidden';
        card.style.transform = `translate(-50%,-50%) translate3d(${x}px,${y}px,${z}px) rotateY(${rotation}deg) rotateZ(${distance * 2.5}deg)`;
        card.style.opacity = String(clamp(1 - Math.max(0, abs - .25) * .35, .12, 1));
        card.style.pointerEvents = abs <= 1.15 ? 'auto' : 'none';
        card.tabIndex = index === currentIndex ? 0 : -1;
        if (abs >= 2.2) card.setAttribute('aria-hidden', 'true');
        else card.removeAttribute('aria-hidden');
      });
      cinemaProgress.style.transform = `scaleX(${.25 + p * .75})`;
    }
  }
  if (!motionPaused && document.visibilityState !== 'hidden' && (Math.abs(pointer.x - pointer.targetX) > .002 || Math.abs(pointer.y - pointer.targetY) > .002 || (heroActive && Math.abs(portraitTarget - portraitProgress) > .0005))) scheduleFrame();
}

function scheduleFrame() {
  if (!frameId) frameId = window.requestAnimationFrame(renderFrame);
}

function goToProject(index) {
  index = clamp(index, 0, depthCards.length - 1);
  if (plainGallery()) {
    depthCards[index].scrollIntoView({ behavior: 'auto', block: 'center' });
    return;
  }
  const top = cinema.getBoundingClientRect().top + window.scrollY;
  const range = Math.max(1, cinema.offsetHeight - cinemaSticky.offsetHeight);
  window.scrollTo({ top: top + index / (depthCards.length - 1) * range, behavior: 'smooth' });
}
previous.addEventListener('click', () => goToProject(currentIndex - 1));
next.addEventListener('click', () => goToProject(currentIndex + 1));
camera.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    goToProject(currentIndex + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
heroSticky.addEventListener('pointermove', event => {
  if (event.pointerType !== 'mouse' || motionPaused) return;
  const bounds = heroSticky.getBoundingClientRect();
  pointer.targetX = (event.clientX - bounds.left) / bounds.width * 2 - 1;
  pointer.targetY = (event.clientY - bounds.top) / bounds.height * 2 - 1;
  scheduleFrame();
}, { passive: true });
heroSticky.addEventListener('pointerleave', () => {
  pointer.targetX = 0;
  pointer.targetY = 0;
  scheduleFrame();
});
window.addEventListener('scroll', scheduleFrame, { passive: true });
window.addEventListener('resize', scheduleFrame, { passive: true });
window.addEventListener('load', scheduleFrame);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    window.cancelAnimationFrame(frameId);
    frameId = 0;
  } else scheduleFrame();
});

applyMotion();
if ('IntersectionObserver' in window && !motionPaused) {
  document.body.classList.add('js-motion');
  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: .05 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// Keep every project reachable through an explicit category filter.
const filters = [...document.querySelectorAll('[data-filter]')];
const archiveCards = [...document.querySelectorAll('.archive-card')];
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  let shown = 0;
  archiveCards.forEach(card => {
    card.hidden = button.dataset.filter !== 'all' && card.dataset.group !== button.dataset.filter;
    if (!card.hidden) { card.classList.add('visible'); shown += 1; }
  });
  document.querySelector('#filter-status').textContent = `Showing ${shown} projects`;
}));

// A compact chapter marker follows the section currently in view.
const navigation = [...document.querySelectorAll('.site-header nav a')];
if ('IntersectionObserver' in window) {
  const navigationObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const sectionId = entry.target.id === 'all-projects' ? 'projects' : entry.target.id;
      navigation.forEach(link => {
        const active = link.hash === `#${sectionId}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  }, {rootMargin: '-30% 0px -60% 0px', threshold: 0});
  document.querySelectorAll('main > section').forEach(section => navigationObserver.observe(section));
}
