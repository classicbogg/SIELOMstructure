  document.querySelectorAll(".ring[data-text]").forEach(ring => {
    const text = ring.dataset.text;
    const radius = 120;          // радиус (подгоняется)
    const start = -90;          // стартовый угол (верх)
    const step = 6;             // шаг между символами (подгоняется)

    ring.innerHTML = "";
    [...text].forEach((ch, i) => {
      const span = document.createElement("span");
      span.textContent = ch;

      const angle = start + i * step;
      span.style.transform =
        `rotate(${angle}deg) translate(${radius}px) rotate(90deg)`; 
      // последнее rotate(90deg) — чтобы буквы стояли “по касательной”

      ring.appendChild(span);
    });
  });
  document.addEventListener('DOMContentLoaded', () => {
    const icon = document.getElementById('teamRevealIcon');
    const btn  = document.getElementById('teamRevealBtn');

    icon.addEventListener('click', () => {
      const opened = btn.classList.toggle('is-open');
      icon.setAttribute('aria-expanded', opened ? 'true' : 'false');
    });
  });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.section').forEach((section) => {
    const strip = section.querySelector('.strip');
    const prev = section.querySelector('.arrow-btn[aria-label="Назад"]');
    const next = section.querySelector('.arrow-btn[aria-label="Вперёд"]');
    if (!strip || !prev || !next) return;

    const getStep = () => {
      const card = strip.querySelector('.shot');
      if (!card) return 320;
      const gap = parseFloat(getComputedStyle(strip).gap || '0');
      return card.getBoundingClientRect().width + gap;
    };

    const update = () => {
      const max = strip.scrollWidth - strip.clientWidth;
      prev.disabled = strip.scrollLeft <= 2;
      next.disabled = strip.scrollLeft >= max - 2;
    };

    prev.addEventListener('click', () => {
      strip.scrollBy({ left: -getStep(), behavior: 'smooth' });
    });

    next.addEventListener('click', () => {
      strip.scrollBy({ left: getStep(), behavior: 'smooth' });
    });

    strip.addEventListener('scroll', () => requestAnimationFrame(update));
    window.addEventListener('resize', update);
    update();
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const thumbs = document.querySelectorAll('.shot__img img');
  if (!thumbs.length) return;

  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = `
    <div class="lightbox__dialog" role="dialog" aria-modal="true">
      <div class="lightbox__stage">
        <img class="lightbox__img" alt="">
      </div>

      <div class="lightbox__controls">
        <button class="lightbox__btn" data-zoom="out" aria-label="Уменьшить">−</button>
        <button class="lightbox__btn" data-zoom="in" aria-label="Увеличить">+</button>
        <button class="lightbox__btn" data-zoom="reset" aria-label="Сброс">⟲</button>
      </div>

      <button class="lightbox__close" aria-label="Закрыть">✕</button>
    </div>
  `;
  document.body.appendChild(lb);

  const dialog = lb.querySelector('.lightbox__dialog');
  const stage = lb.querySelector('.lightbox__stage');
  const img = lb.querySelector('.lightbox__img');
  const closeBtn = lb.querySelector('.lightbox__close');

  let zoom = 1;
  const MIN = 1;
  const MAX = 4;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const applyZoom = () => {
    img.style.transform = `scale(${zoom})`;
  };

  const reset = () => {
    zoom = 1;
    applyZoom();
    // стартуем сверху 
    stage.scrollTop = 0;
    // по центру по горизонтали
    stage.scrollLeft = Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2);
  };

  const zoomBy = (mult) => {
    //  центр просмотра 
    const cx = (stage.scrollLeft + stage.clientWidth / 2) / (stage.scrollWidth || 1);
    const cy = (stage.scrollTop  + stage.clientHeight / 2) / (stage.scrollHeight || 1);

    zoom = clamp(zoom * mult, MIN, MAX);
    applyZoom();

    requestAnimationFrame(() => {
      stage.scrollLeft = cx * stage.scrollWidth - stage.clientWidth / 2;
      stage.scrollTop  = cy * stage.scrollHeight - stage.clientHeight / 2;
    });
  };

  const open = (src, alt) => {
    lb.classList.add('is-open');
    document.body.classList.add('modal-open');

    img.alt = alt || '';
    img.onload = () => reset();
    img.onerror = () => console.error('Lightbox: не удалось загрузить:', img.src);

    img.src = src;
  };

  const close = () => {
    lb.classList.remove('is-open');
    document.body.classList.remove('modal-open');
    img.removeAttribute('src');
  };

  closeBtn.addEventListener('click', close);
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lb.classList.contains('is-open')) close();
  });

  lb.querySelectorAll('.lightbox__btn').forEach((b) => {
    b.addEventListener('click', () => {
      const t = b.dataset.zoom;
      if (t === 'in') zoomBy(1.25);
      if (t === 'out') zoomBy(0.8);
      if (t === 'reset') reset();
    });
  });

  // ПК: Ctrl+wheel = zoom, без Ctrl — обычный скролл 
  const onWheel = (e) => {
    if (!lb.classList.contains('is-open')) return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      zoomBy(e.deltaY > 0 ? 0.9 : 1.1);
    }
  };
  dialog.addEventListener('wheel', onWheel, { passive: false });

  // открыть по клику (и не открывать при свайпе ленты)
  const DRAG_TRESH = 10;
  thumbs.forEach((t) => {
    let downX = 0, downY = 0, moved = false;
    t.addEventListener('pointerdown', (e) => {
      downX = e.clientX; downY = e.clientY; moved = false;
    });
    t.addEventListener('pointermove', (e) => {
      if (Math.abs(e.clientX - downX) > DRAG_TRESH || Math.abs(e.clientY - downY) > DRAG_TRESH) moved = true;
    });
    t.addEventListener('click', () => {
      if (moved) return;
      open(t.getAttribute('src') || t.src, t.alt);
    });
  });
});