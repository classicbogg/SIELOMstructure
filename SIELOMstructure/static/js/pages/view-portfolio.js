document.addEventListener("DOMContentLoaded", () => {
  const mainPreview = document.getElementById("mainPreview");
  const thumbs = document.querySelectorAll(".project-thumb");
  const scrollBtn = document.getElementById("scrollToDescription");
  const description = document.getElementById("description");
  const relatedStrip = document.getElementById("relatedStrip");
  const prevBtn = document.getElementById("relatedPrev");
  const nextBtn = document.getElementById("relatedNext");
  const favoriteBtn = document.querySelector(".project-favorite");

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const image = thumb.dataset.image;
      if (mainPreview && image) {
        mainPreview.src = image;
      }

      thumbs.forEach((item) => item.classList.remove("is-active"));
      thumb.classList.add("is-active");
    });
  });

  if (scrollBtn && description) {
    scrollBtn.addEventListener("click", () => {
      description.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  if (prevBtn && relatedStrip) {
    prevBtn.addEventListener("click", () => {
      relatedStrip.scrollBy({
        left: -320,
        behavior: "smooth"
      });
    });
  }

  if (nextBtn && relatedStrip) {
    nextBtn.addEventListener("click", () => {
      relatedStrip.scrollBy({
        left: 320,
        behavior: "smooth"
      });
    });
  }

  if (favoriteBtn) {
    favoriteBtn.addEventListener("click", () => {
      favoriteBtn.classList.toggle("is-active");
    });
  }
});