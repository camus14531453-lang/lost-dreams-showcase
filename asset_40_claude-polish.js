// Claude polish layer: reveal-on-scroll, dusk, prop drift, cursor torch,
// screen power-on, gallery dots + crossfade + swipe. All respect reduced motion.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const page = document.querySelector('.page');
  const body = document.querySelector('.bodyarea');

  // reveal
  const targets = document.querySelectorAll('.paper, .shot-gallery, .motion-panel, .download-area, .project-notes');
  targets.forEach(el => el.classList.add('reveal'));
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
    targets.forEach(el => io.observe(el));
  } else targets.forEach(el => el.classList.add('in'));

  // dusk + drift
  const props = [...document.querySelectorAll('.award.scattered, .memory-prop')].map((el, i) => ({ el, k: [-.05, .04, -.07, .06, -.035, .05, -.06, .045, -.04][i % 9] }));
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const r = body.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (r.height + innerHeight)));
      body.style.setProperty('--dusk', p.toFixed(3));
      if (!reduce) props.forEach(({ el, k }) => {
        const b = el.getBoundingClientRect(); const c = b.top + b.height / 2 - innerHeight / 2;
        el.style.setProperty('--drift', (c * k).toFixed(1));
      });
    });
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // cursor torch over the wall
  if (!reduce && matchMedia('(hover: hover)').matches) {
    const torch = document.createElement('div'); torch.className = 'torch'; document.body.appendChild(torch);
    addEventListener('pointermove', e => {
      torch.style.setProperty('--mx', e.clientX + 'px'); torch.style.setProperty('--my', e.clientY + 'px');
      const inWall = body.getBoundingClientRect(); torch.classList.toggle('on', e.clientY > inWall.top && e.clientY < inWall.bottom);
    }, { passive: true });
  }

  // screen power-on (once per visit)
  const screen = document.querySelector('.screen');
  if (screen) {
    const fit = () => screen.style.setProperty('--fit', screen.clientWidth / 1600);
    fit(); addEventListener('resize', fit);
    if (!reduce) { screen.classList.add('boot'); setTimeout(() => screen.classList.remove('boot'), 1300); }
  }

  // galleries: dots, crossfade, swipe (wraps original stepGallery/paintGallery)
  if (typeof galleryData !== 'undefined' && typeof paintGallery === 'function') {
    const base = paintGallery;
    const dotsFor = [];
    galleries.forEach((el, g) => {
      const wrap = document.createElement('div'); wrap.className = 'gallery-dots'; wrap.setAttribute('role', 'tablist');
      galleryData[g].images.forEach((im, i) => {
        const b = document.createElement('button'); b.setAttribute('aria-label', im.alt);
        b.onclick = () => { galleryState[g] = i; paintGallery(g); };
        wrap.appendChild(b);
      });
      el.querySelector('.gallery-navigation').prepend(wrap); dotsFor[g] = wrap;
      // swipe
      let x0 = null;
      el.querySelector('.shot-open').addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
      el.querySelector('.shot-open').addEventListener('touchend', e => {
        if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
        if (Math.abs(dx) > 40) { e.preventDefault(); stepGallery(g, dx < 0 ? 1 : -1); }
      });
    });
    window.paintGallery = paintGallery = function (g) {
      const img = galleries[g].querySelector('.shot-open img');
      const want = galleryData[g].images[galleryState[g]].src;
      const first = !img.dataset.painted;
      const done = () => { base(g); img.dataset.painted = 1; requestAnimationFrame(() => img.classList.remove('swap')); };
      [...dotsFor[g].children].forEach((d, i) => d.setAttribute('aria-current', String(i === galleryState[g])));
      if (first || reduce || img.getAttribute('src') === want) return done();
      img.classList.add('swap');
      const pre = new Image(); pre.src = want;
      Promise.all([new Promise(r => setTimeout(r, 180)), pre.decode().catch(() => {})]).then(done);
    };
    galleries.forEach((_, g) => paintGallery(g));
  }
})();
