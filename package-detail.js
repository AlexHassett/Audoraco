document.querySelectorAll('[data-package-gallery]').forEach((gallery) => {
  const image = gallery.querySelector('[data-package-image]');
  const selectors = [...gallery.querySelectorAll('[data-colour-option]')];

  if (!image || !selectors.length) return;

  selectors.forEach((selector) => {
    selector.addEventListener('click', () => {
      const { imageSrc, imageAlt } = selector.dataset;
      if (!imageSrc || !imageAlt) return;

      image.src = imageSrc;
      image.alt = imageAlt;

      selectors.forEach((option) => {
        option.setAttribute('aria-pressed', String(option === selector));
      });
    });
  });
});
