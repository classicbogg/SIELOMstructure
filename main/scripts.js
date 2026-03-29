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