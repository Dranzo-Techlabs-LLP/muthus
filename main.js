/* =========================================================
   Muthu's Event Management — interactions & scroll motion
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  $('#year').textContent = new Date().getFullYear();
  document.body.classList.add('is-loading');

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduceMotion && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    lenis.stop();
  }

  const scrollToTarget = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else (typeof target === 'string' ? $(target) : target)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  /* ---------- Anchor links + mobile menu ---------- */
  const toggle = $('.nav__toggle');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    $('.menu').setAttribute('aria-hidden', String(!open));
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2 && id !== '#') return;
      const target = id === '#' || id === '#top' ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      if (document.body.classList.contains('menu-open')) setMenu(false);
      scrollToTarget(target);
    });
  });

  /* ---------- Nav state ---------- */
  const nav = $('.nav');
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    nav.classList.toggle('is-hidden', y > lastY && y > 400 && !document.body.classList.contains('menu-open'));
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Contact form → WhatsApp ---------- */
  const WHATSAPP_NUMBER = '966510807449';
  const form = $('#contactForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach((el) => {
      const bad = !el.value.trim();
      el.closest('.field').classList.toggle('is-invalid', bad);
      if (bad) ok = false;
    });
    const status = $('.form__status', form);
    if (!ok) { status.textContent = 'Please fill in your name, phone and event type.'; return; }
    const f = form.elements;
    const text = [
      "Hello Muthu's Event Management, I'd like to enquire about an event.",
      '',
      `Name: ${f.name.value.trim()}`,
      `Phone: ${f.phone.value.trim()}`,
      `Event type: ${f.type.value}`,
      f.date.value ? `Event date: ${f.date.value}` : null,
      f.message.value.trim() ? `Details: ${f.message.value.trim()}` : null,
    ].filter((line) => line !== null).join('\n');
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    // Popup blocked (common in in-app browsers) → open WhatsApp in this tab instead
    const win = window.open(url, '_blank');
    if (win) win.opener = null;
    else window.location.href = url;
    const name = f.name.value.trim().split(' ')[0];
    status.textContent = `Thank you, ${name}! WhatsApp is opening with your enquiry — just press send.`;
    form.reset();
  });

  /* ---------- Fit big type to its container ---------- */
  const fitTo = (box, inner, max = Infinity) => {
    box.style.fontSize = '';
    const base = parseFloat(getComputedStyle(box).fontSize);
    const w = inner.offsetWidth;
    if (!w) return;
    box.style.fontSize = Math.min(max, (base * box.clientWidth) / w) + 'px';
  };
  const fitAll = () => {
    const title = $('.hero__title');
    if (window.innerWidth >= 900) {
      const lines = $$('.line > span', title);
      title.style.fontSize = '';
      const widest = lines.reduce((a, b) => (b.offsetWidth > a.offsetWidth ? b : a));
      fitTo(title, widest, 150);
    } else {
      title.style.fontSize = '';
    }
    fitTo($('.footer__word'), $('.footer__word-inner'));
  };
  fitAll();
  document.fonts?.ready.then(() => { fitAll(); window.ScrollTrigger?.refresh(); });
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { fitAll(); window.ScrollTrigger?.refresh(); }, 150);
  });

  /* ---------- No GSAP fallback ---------- */
  if (!hasGsap) {
    const finish = () => { $('.loader')?.remove(); document.body.classList.remove('is-loading'); };
    window.addEventListener('load', finish);
    setTimeout(finish, 2500);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Text splitting helpers ---------- */
  // Wrap each word (and each <em>) in a masked span, preserving <br>.
  const splitWords = (el) => {
    const out = [];
    const nodes = [...el.childNodes];
    el.innerHTML = '';
    nodes.forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); return; }
          const wrap = document.createElement('span');
          wrap.className = 'line';
          wrap.style.display = 'inline-block';
          wrap.style.verticalAlign = 'top';
          const inner = document.createElement('span');
          inner.textContent = part;
          wrap.appendChild(inner);
          el.appendChild(wrap);
          out.push(inner);
        });
      } else if (n.nodeName === 'BR') {
        el.appendChild(n);
      } else {
        const wrap = document.createElement('span');
        wrap.className = 'line';
        wrap.style.display = 'inline-block';
        wrap.style.verticalAlign = 'top';
        const inner = document.createElement('span');
        inner.appendChild(n);
        wrap.appendChild(inner);
        el.appendChild(wrap);
        out.push(inner);
      }
    });
    return out;
  };

  /* ---------- Loader + hero intro ---------- */
  const heroLines = $$('.hero__title .line > span');
  gsap.set(heroLines, { yPercent: 110 });
  gsap.set(['.hero__eyebrow', '.hero__sub', '.hero__actions', '.hero__scroll'], { autoAlpha: 0, y: 30 });
  gsap.set('.badge', { scale: 0, rotate: -120 });
  gsap.set('.nav', { yPercent: -100 });
  gsap.set('.hero__media img', { scale: 1.25 });

  const counter = { v: 0 };
  const intro = gsap.timeline({ paused: true });
  intro
    .to('.loader', { yPercent: -100, duration: 1, ease: 'expo.inOut' })
    .to('.hero__media img', { scale: 1, duration: 2.2, ease: 'expo.out' }, '-=0.6')
    .to(heroLines, { yPercent: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out' }, '<0.1')
    .to('.nav', { yPercent: 0, duration: 1, ease: 'expo.out' }, '<0.3')
    .to(['.hero__eyebrow', '.hero__sub', '.hero__actions', '.hero__scroll'], { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, ease: 'power3.out' }, '<0.2')
    .to('.badge', { scale: 1, rotate: 0, duration: 1.4, ease: 'back.out(1.6)' }, '<')
    .add(() => {
      $('.loader')?.remove();
      document.body.classList.remove('is-loading');
      if (lenis) lenis.start();
      ScrollTrigger.refresh();
    }, 0.9);

  const loadDone = new Promise((res) => {
    if (document.readyState === 'complete') res();
    else window.addEventListener('load', res);
    setTimeout(res, 4000);
  });

  gsap.to(counter, {
    v: 100,
    duration: reduceMotion ? 0.2 : 1.6,
    ease: 'power2.inOut',
    onUpdate: () => {
      $('#loaderNum').textContent = Math.round(counter.v);
      $('.loader__bar span').style.width = counter.v + '%';
    },
    onComplete: () => loadDone.then(() => intro.play()),
  });

  if (reduceMotion) return; // keep the page static beyond the intro

  /* ---------- Cursor ---------- */
  const cursor = $('.cursor');
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('mousemove', (e) => { xTo(e.clientX); yTo(e.clientY); });
    const label = $('.cursor__label', cursor);
    $$('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => { label.textContent = el.dataset.cursor; cursor.classList.add('is-big'); });
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-big'));
    });
    $$('a, button, input, select, textarea').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-link'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-link'));
    });

    /* magnetic buttons */
    $$('.magnetic').forEach((btn) => {
      const bx = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      const by = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        bx((e.clientX - r.left - r.width / 2) * 0.3);
        by((e.clientY - r.top - r.height / 2) * 0.4);
      });
      btn.addEventListener('mouseleave', () => { bx(0); by(0); });
    });
  }

  /* ---------- Scroll progress ---------- */
  gsap.to('.progress span', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
  });

  /* ---------- Hero scroll ---------- */
  gsap.fromTo('.hero__media',
    { clipPath: 'inset(0% 0% 0% 0% round 0px)' },
    { clipPath: 'inset(4% 3% 8% 3% round 40px)', ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__media img', {
    yPercent: 12, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero__content', {
    y: -120, autoAlpha: 0.2, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true },
  });
  gsap.to('.badge', {
    rotate: 180, y: 120, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  /* ---------- Marquee (velocity reactive) ---------- */
  const marquee = gsap.to('.marquee__track', { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    trigger: '.marquee', start: 'top bottom', end: 'bottom top',
    onUpdate: (self) => {
      const v = gsap.utils.clamp(1, 6, Math.abs(self.getVelocity()) / 300);
      gsap.to(marquee, { timeScale: self.direction * v, duration: 0.2, overwrite: true });
      gsap.to(marquee, { timeScale: self.direction, duration: 1.2, delay: 0.25 });
    },
  });

  /* ---------- Statement: words light up ---------- */
  const st = $('[data-words]');
  const words = st.textContent.trim().split(/\s+/);
  st.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
  gsap.to($$('.w', st), {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: st, start: 'top 80%', end: 'bottom 40%', scrub: true },
  });

  /* ---------- Headline word reveals ---------- */
  $$('.reveal-lines').forEach((h) => {
    const parts = splitWords(h);
    gsap.from(parts, {
      yPercent: 110, rotate: 4, duration: 1.1, stagger: 0.06, ease: 'expo.out',
      scrollTrigger: { trigger: h, start: 'top 85%' },
    });
  });

  $$('.fade-up').forEach((el) => {
    gsap.from(el, {
      y: 50, autoAlpha: 0, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
    });
  });

  $$('.eyebrow').forEach((el) => {
    if (el.closest('.hero, .zoom')) return;
    gsap.from(el, { autoAlpha: 0, x: -20, duration: 0.8, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });

  /* ---------- About ---------- */
  gsap.fromTo('.about__emblem',
    { rotate: -30, scale: 0.8 },
    { rotate: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'center center', scrub: 1 } });
  gsap.from('.about__tag', {
    scale: 0, autoAlpha: 0, duration: 0.9, ease: 'back.out(2)',
    scrollTrigger: { trigger: '.about__visual', start: 'top 60%' },
  });

  $$('.count').forEach((el) => {
    const to = +el.dataset.to;
    const o = { v: 0 };
    gsap.to(o, {
      v: to, duration: 2.2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-IN'); },
    });
  });
  gsap.from('.stat', {
    y: 40, autoAlpha: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.stats', start: 'top 88%' },
  });

  /* ---------- Zoom reveal (pinned) ---------- */
  const zoomTl = gsap.timeline({
    scrollTrigger: { trigger: '.zoom__pin', start: 'top top', end: '+=180%', pin: true, scrub: 1, anticipatePin: 1 },
  });
  zoomTl
    .to('.zoom__media', { width: '100vw', height: '100vh', borderRadius: 0, ease: 'power2.inOut', duration: 1 }, 0)
    .fromTo('.zoom__media img', { scale: 1.45 }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
    .to('.zoom__words span:first-child', { xPercent: -140, autoAlpha: 0, ease: 'power2.in', duration: 0.7 }, 0)
    .to('.zoom__words span:last-child', { xPercent: 140, autoAlpha: 0, ease: 'power2.in', duration: 0.7 }, 0)
    .to('.zoom__shade', { opacity: 1, duration: 0.4 }, 0.6)
    .from('.zoom__caption > *', { y: 80, autoAlpha: 0, stagger: 0.12, duration: 0.5, ease: 'power3.out' }, 0.8)
    .to({}, { duration: 0.3 });

  /* ---------- Services horizontal scroll ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const pin = $('.services__pin');
    const track = $('.services__track');
    const dist = () => Math.max(0, track.offsetLeft + track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: pin, start: 'top top', end: () => '+=' + dist(),
        pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
      },
    });
    $$('.card', track).forEach((card) => {
      gsap.fromTo(card, { rotate: 5, y: 60, scale: 0.92 }, {
        rotate: 0, y: 0, scale: 1, ease: 'power2.out',
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 105%', end: 'left 55%', scrub: true },
      });
      gsap.fromTo($('img', card), { xPercent: -8 }, {
        xPercent: 8, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
      });
    });
  });
  mm.add('(max-width: 899px)', () => {
    $$('.card').forEach((card) => {
      gsap.from(card, { y: 80, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: card, start: 'top 90%' } });
    });
  });

  /* ---------- Bento gallery ---------- */
  $$('.tile').forEach((tile, i) => {
    gsap.fromTo(tile,
      { clipPath: 'inset(100% 0% 0% 0% round 22px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 22px)', duration: 1.4, ease: 'expo.inOut', delay: (i % 3) * 0.08,
        scrollTrigger: { trigger: tile, start: 'top 90%' } });
    gsap.fromTo($('img', tile), { yPercent: -8, scale: 1.15 }, {
      yPercent: 8, scale: 1, ease: 'none',
      scrollTrigger: { trigger: tile, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  /* ---------- Process ---------- */
  gsap.to('.steps__line span', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: '.steps', start: 'top 75%', end: 'bottom 55%', scrub: true },
  });
  $$('.step').forEach((s, i) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.steps', start: 'top 75%', end: 'bottom 55%', scrub: true } });
    tl.from(s, { y: 60, autoAlpha: 0, duration: 1 }, i * 0.6)
      .fromTo($('.step__dot', s), { scale: 0.4, backgroundColor: '#0d0b08' }, { scale: 1.3, backgroundColor: '#c7973a', duration: 0.6 }, i * 0.6 + 0.3);
  });

  /* ---------- Testimonials stacking ---------- */
  const quotes = $$('.quote');
  quotes.forEach((q, i) => {
    gsap.from(q, { y: 100, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: q, start: 'top 95%' } });
    const next = quotes[i + 1];
    if (!next) return;
    gsap.to(q, {
      scale: 0.9 + i * 0.03, filter: 'brightness(0.55)', ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 20%', scrub: true },
    });
  });

  /* ---------- Contact big text ---------- */
  gsap.fromTo('.contact__big', { xPercent: 18 }, {
    xPercent: -18, ease: 'none',
    scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'center top', scrub: true },
  });

  /* ---------- Footer ---------- */
  gsap.fromTo('.footer__word span', { yPercent: 105 }, {
    yPercent: 0, stagger: 0.08, ease: 'power3.out',
    scrollTrigger: { trigger: '.footer', start: 'top 85%', end: 'bottom bottom', scrub: 0.6 },
  });
  gsap.from('.footer__top > *', {
    y: 40, autoAlpha: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out',
    scrollTrigger: { trigger: '.footer', start: 'top 85%' },
  });

  /* ---------- Refresh once fonts/images settle ---------- */
  window.addEventListener('load', () => { fitAll(); ScrollTrigger.refresh(); });
})();
