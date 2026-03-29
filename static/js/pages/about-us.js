      document.querySelectorAll(".ring[data-text]").forEach(ring => {
      const text = ring.dataset.text;
      const radius = 120;
      const start = -90;
      const step = 6;
      ring.innerHTML = "";
      [...text].forEach((ch, i) => {
        const span = document.createElement("span");
        span.textContent = ch;
        const angle = start + i * step;
        span.style.transform = `rotate(${angle}deg) translate(${radius}px) rotate(90deg)`;
        ring.appendChild(span);
      });
    });