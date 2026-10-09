/*
 * Site-wide motion. Everything here is progressive enhancement: markup is fully
 * readable without it, and users who prefer reduced motion get the final state
 * straight away.
 *
 * Hooks (data attributes):
 *   data-reveal="up|down|left|right|zoom|blur|mask"  animate in when scrolled into view
 *   data-stagger="80"        on a parent: children with data-reveal get increasing delays (ms)
 *   data-split               on a heading: words slide up one after another
 *   data-count="120"         count up from 0 (optional data-suffix / data-prefix)
 *   data-parallax="0.15"     move at a different speed while scrolling (+ slower, - faster)
 *   data-magnetic            element drifts toward the pointer
 *   data-tilt                3D tilt toward the pointer
 *   data-spotlight           sets --mx/--my for a pointer-following glow
 */

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function splitWords(el: HTMLElement) {
  if (el.dataset.splitDone) return;
  el.dataset.splitDone = 'true';
  // Keep the accessible name intact: screen readers read the label, not the fragments.
  el.setAttribute('aria-label', el.textContent?.trim() ?? '');
  let i = 0;
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = (child.textContent ?? '').split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const part of parts) {
          if (!part) continue;
          if (/^\s+$/.test(part)) {
            frag.append(document.createTextNode(part));
            continue;
          }
          const word = document.createElement('span');
          word.className = 'word';
          word.setAttribute('aria-hidden', 'true');
          const inner = document.createElement('span');
          inner.textContent = part;
          inner.style.setProperty('--i', String(i++));
          word.append(inner);
          frag.append(word);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    }
  };
  walk(el);
}

function animateCount(el: HTMLElement) {
  const target = Number(el.dataset.count ?? 0);
  const prefix = el.dataset.prefix ?? '';
  const suffix = el.dataset.suffix ?? '';
  const format = (n: number) => `${prefix}${Math.round(n).toLocaleString()}${suffix}`;
  if (reduceMotion) {
    el.textContent = format(target);
    return;
  }
  const duration = 1800;
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = format(target * eased);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function initReveals() {
  document.querySelectorAll<HTMLElement>('[data-stagger]').forEach((parent) => {
    const step = Number(parent.dataset.stagger) || 80;
    parent.querySelectorAll<HTMLElement>(':scope > [data-reveal], :scope > * > [data-reveal]').forEach((child, i) => {
      if (!child.style.getPropertyValue('--reveal-delay')) {
        child.style.setProperty('--reveal-delay', String(i * step));
      }
    });
  });
  document.querySelectorAll<HTMLElement>('[data-split]').forEach(splitWords);

  const targets = document.querySelectorAll<HTMLElement>('[data-reveal], [data-split], [data-count]');
  const show = (el: HTMLElement) => {
    el.classList.add('is-visible');
    if (el.dataset.count !== undefined) animateCount(el);
  };

  if (reduceMotion || !('IntersectionObserver' in window)) {
    targets.forEach(show);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        show(entry.target as HTMLElement);
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
  );
  targets.forEach((el) => io.observe(el));
}

function initScrollEffects() {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  const progress = document.querySelector<HTMLElement>('[data-scroll-progress]');
  const parallax = reduceMotion ? [] : Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.scrollY;
    header?.classList.toggle('is-scrolled', y > 12);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    }
    const vh = window.innerHeight;
    for (const el of parallax) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > vh + 200) continue;
      const speed = Number(el.dataset.parallax) || 0.15;
      const offset = (rect.top + rect.height / 2 - vh / 2) * speed * -1;
      el.style.translate = `0 ${offset.toFixed(1)}px`;
    }
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  window.addEventListener('resize', update, { passive: true });
  update();
}

function initPointerEffects() {
  if (reduceMotion || !finePointer) return;

  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      el.style.translate = `${x}px ${y}px`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.translate = '';
    });
  });

  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    el.style.transition = 'transform 300ms var(--ease-out)';
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 10).toFixed(2)}deg)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
    });
  });

  document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

initReveals();
initScrollEffects();
initPointerEffects();
