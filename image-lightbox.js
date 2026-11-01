const lightboxImages = document.querySelectorAll('.package-image img, .palette-image, [data-package-image]');

if (lightboxImages.length) {
  const lightbox = document.createElement('div');
  lightbox.className = 'image-lightbox';
  lightbox.hidden = true;
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-label', 'Enlarged package image');
  lightbox.innerHTML = `
    <button class="image-lightbox-close" type="button" aria-label="Close enlarged image">&times;</button>
    <figure class="image-lightbox-content">
      <img class="image-lightbox-image" alt="" />
      <figcaption class="image-lightbox-caption"></figcaption>
    </figure>
  `;
  document.body.append(lightbox);

  const enlargedImage = lightbox.querySelector('.image-lightbox-image');
  const caption = lightbox.querySelector('.image-lightbox-caption');
  const closeButton = lightbox.querySelector('.image-lightbox-close');
  let opener = null;

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.classList.remove('lightbox-open');
    opener?.focus();
  };

  const openLightbox = (image) => {
    opener = image;
    enlargedImage.src = image.currentSrc || image.src;
    enlargedImage.alt = image.alt;
    caption.textContent = image.alt;
    lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    closeButton.focus();
  };

  lightboxImages.forEach((image) => {
    image.classList.add('is-enlargeable');
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', `${image.alt}. Open larger image.`);
    image.title = 'Click to enlarge';

    image.addEventListener('click', () => openLightbox(image));
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(image);
      }
    });
  });

  closeButton.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });
}
