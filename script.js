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

const eventEnquiryForm = document.querySelector('#event-enquiry-form');

if (eventEnquiryForm) {
  const formStatus = eventEnquiryForm.querySelector('#form-status');
  const eventDate = eventEnquiryForm.querySelector('#event-date');
  const startTime = eventEnquiryForm.querySelector('#event-start-time');
  const finishTime = eventEnquiryForm.querySelector('#event-finish-time');
  const durationMessage = eventEnquiryForm.querySelector('#event-duration-message');
  const eventSetting = eventEnquiryForm.querySelector('#event-setting');
  const surfaceField = eventEnquiryForm.querySelector('#outdoor-surface-field');
  const surfaceType = eventEnquiryForm.querySelector('#surface-type');
  const phone = eventEnquiryForm.querySelector('#phone');

  const today = new Date();
  const localToday = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
  eventDate.min = localToday;

  const updateOutdoorSurface = () => {
    const isOutdoors = eventSetting.value === 'outdoors';
    surfaceField.hidden = !isOutdoors;
    surfaceType.disabled = !isOutdoors;
    surfaceType.required = isOutdoors;
    eventSetting.setAttribute('aria-expanded', String(isOutdoors));
    if (!isOutdoors) surfaceType.value = '';
  };

  const minutesFromTime = (value) => {
    const [hours, minutes] = value.split(':').map(Number);
    return (hours * 60) + minutes;
  };

  const validateTimes = () => {
    finishTime.setCustomValidity('');
    durationMessage.textContent = '';
    if (!startTime.value || !finishTime.value) return;

    const duration = minutesFromTime(finishTime.value) - minutesFromTime(startTime.value);
    if (duration <= 0) {
      finishTime.setCustomValidity('Event finish time must be after the event start time.');
      durationMessage.textContent = 'Event finish time must be after the event start time.';
      durationMessage.classList.add('is-error');
      return;
    }

    durationMessage.classList.remove('is-error');
    if (duration > 360) durationMessage.textContent = 'Our standard hire period is up to 6 hours. Longer celebrations may be available by arrangement.';
  };

  const validatePhone = () => {
    const compactPhone = phone.value.replace(/[\s()-]/g, '');
    const isValid = /^(?:\+?61|0)[2-478]\d{8}$/.test(compactPhone);
    phone.setCustomValidity(!phone.value || isValid ? '' : 'Please enter a valid Australian phone number.');
  };

  eventSetting.addEventListener('change', updateOutdoorSurface);
  startTime.addEventListener('change', validateTimes);
  finishTime.addEventListener('change', validateTimes);
  phone.addEventListener('input', validatePhone);
  updateOutdoorSurface();

  const subject = new URLSearchParams(window.location.search).get('subject')?.toLowerCase() || '';
  const packagePreference = eventEnquiryForm.querySelector('#package-preference');
  const subjectPackage = [...packagePreference.options].find((option) => subject.includes(option.textContent.split(' — ')[0].toLowerCase()));
  if (subjectPackage) packagePreference.value = subjectPackage.value;

  eventEnquiryForm.addEventListener('submit', (event) => {
    event.preventDefault();
    validateTimes();
    validatePhone();

    if (!eventEnquiryForm.checkValidity()) {
      formStatus.classList.remove('is-success');
      formStatus.textContent = 'Please review the highlighted fields and complete the required information before continuing.';
      eventEnquiryForm.reportValidity();
      return;
    }

    formStatus.classList.add('is-success');
    formStatus.innerHTML = '<strong>Thank you for your enquiry.</strong><p>We\'ve received the details of your celebration and will be in touch to confirm availability and prepare your personalised quote.</p><p>Please note that submitting an enquiry does not reserve your event date.</p>';
    formStatus.focus();
  });
}

const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    faqItems.forEach((otherItem) => {
      if (otherItem !== item) otherItem.open = false;
    });
  });
});
