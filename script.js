document.querySelector('.newsletter form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  event.currentTarget.querySelector('input').value = '';
  event.currentTarget.querySelector('input').placeholder = 'Thank you for subscribing';
});
