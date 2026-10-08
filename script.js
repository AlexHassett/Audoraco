document.querySelector('.newsletter form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const emailInput = event.currentTarget.querySelector('input');
  emailInput.value = '';
  emailInput.placeholder = 'Thank you for subscribing';
});

document.querySelectorAll('.site-header').forEach((header) => {
  const menuToggle = header.querySelector('.mobile-menu-toggle');
  const navigation = header.querySelector('.nav-links');
  if (!menuToggle || !navigation) return;

  const closeMenu = () => {
    header.classList.remove('nav-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
  };

  menuToggle.addEventListener('click', () => {
    const opening = !header.classList.contains('nav-open');
    header.classList.toggle('nav-open', opening);
    menuToggle.setAttribute('aria-expanded', String(opening));
    menuToggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
  });

  navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
});

const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    faqItems.forEach((otherItem) => {
      if (otherItem !== item) otherItem.open = false;
    });
  });
});
