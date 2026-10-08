const openingNotice = document.querySelector('#bookings-opening');
const enquiryContent = document.querySelector('#enquiry-content');
const eventEnquiryForm = document.querySelector('#event-enquiry-form');

const initialiseEnquiryForm = (blockedDates) => {
  openingNotice.hidden = true;
  enquiryContent.hidden = false;

  if (!eventEnquiryForm) return;
  const formStatus = eventEnquiryForm.querySelector('#form-status');
  const eventDate = eventEnquiryForm.querySelector('#event-date');
  const startTime = eventEnquiryForm.querySelector('#event-start-time');
  const finishTime = eventEnquiryForm.querySelector('#event-finish-time');
  const durationMessage = eventEnquiryForm.querySelector('#event-duration-message');
  const eventSetting = eventEnquiryForm.querySelector('#event-setting');
  const surfaceField = eventEnquiryForm.querySelector('#outdoor-surface-field');
  const surfaceType = eventEnquiryForm.querySelector('#surface-type');
  const phone = eventEnquiryForm.querySelector('#phone');
  const calendar = eventEnquiryForm.querySelector('#availability-calendar');
  const calendarMonth = eventEnquiryForm.querySelector('#calendar-month');
  const calendarDays = eventEnquiryForm.querySelector('#calendar-days');
  const previousMonth = eventEnquiryForm.querySelector('#calendar-previous');
  const nextMonth = eventEnquiryForm.querySelector('#calendar-next');
  const calendarKey = eventEnquiryForm.querySelector('.calendar-key');
  const blockedDateSet = new Set(blockedDates);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  calendarKey.insertAdjacentHTML('beforeend', '<span><i class="is-past"></i>Past</span>');

  const toIsoDate = (date) => [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

  const formatSelectedDate = (date) => new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

  const closeCalendar = () => {
    calendar.hidden = true;
    eventDate.setAttribute('aria-expanded', 'false');
  };

  const renderCalendar = () => {
    calendarMonth.textContent = new Intl.DateTimeFormat('en-AU', { month: 'long', year: 'numeric' }).format(displayedMonth);
    calendarDays.replaceChildren();

    const firstDay = displayedMonth.getDay();
    const daysInMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 0).getDate();
    const previousMonthDays = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 0).getDate();

    for (let cell = 0; cell < 42; cell += 1) {
      const dayOffset = cell - firstDay + 1;
      const date = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), dayOffset);
      const isCurrentMonth = dayOffset > 0 && dayOffset <= daysInMonth;
      const dayNumber = dayOffset <= 0 ? previousMonthDays + dayOffset : (dayOffset > daysInMonth ? dayOffset - daysInMonth : dayOffset);
      const isoDate = toIsoDate(date);
      const isPast = date < today;
      const isBlocked = blockedDateSet.has(isoDate);
      const unavailable = isPast || isBlocked;
      const button = document.createElement('button');

      button.type = 'button';
      button.textContent = String(dayNumber);
      button.setAttribute('role', 'gridcell');
      button.className = 'calendar-day';
      if (!isCurrentMonth) button.classList.add('is-outside-month');
      if (isoDate === eventDate.dataset.value) button.classList.add('is-selected');
      if (isPast) button.classList.add('is-past');
      if (isBlocked) button.classList.add('is-unavailable');
      button.disabled = unavailable || !isCurrentMonth;
      button.setAttribute('aria-label', `${formatSelectedDate(date)}, ${isPast ? 'past date' : (isBlocked ? 'unavailable' : 'available')}`);

      if (!button.disabled) {
        button.addEventListener('click', () => {
          eventDate.dataset.value = isoDate;
          eventDate.value = formatSelectedDate(date);
          eventDate.setCustomValidity('');
          closeCalendar();
        });
      }

      calendarDays.append(button);
    }

    previousMonth.disabled = displayedMonth.getFullYear() === today.getFullYear() && displayedMonth.getMonth() === today.getMonth();
  };

  eventDate.addEventListener('click', () => {
    calendar.hidden = !calendar.hidden;
    eventDate.setAttribute('aria-expanded', String(!calendar.hidden));
    if (!calendar.hidden) renderCalendar();
  });

  eventDate.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      eventDate.click();
    }
    if (event.key === 'Escape') closeCalendar();
  });

  previousMonth.addEventListener('click', () => {
    displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  nextMonth.addEventListener('click', () => {
    displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  document.addEventListener('click', (event) => {
    if (!calendar.hidden && !event.target.closest('.calendar-field')) closeCalendar();
  });

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

  eventEnquiryForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    validateTimes();
    validatePhone();
    eventDate.setCustomValidity(eventDate.dataset.value ? '' : 'Please select an available event date.');

    if (!eventDate.dataset.value || !eventEnquiryForm.checkValidity()) {
      formStatus.classList.remove('is-success');
      formStatus.textContent = 'Please review the highlighted fields and complete the required information before continuing.';
      eventEnquiryForm.reportValidity();
      if (!eventDate.dataset.value) eventDate.focus();
      return;
    }

    const submitButton = eventEnquiryForm.querySelector('button[type="submit"]');
    const payload = Object.fromEntries(new FormData(eventEnquiryForm).entries());
    payload.eventDate = eventDate.dataset.value;
    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
    formStatus.classList.remove('is-success');
    formStatus.textContent = '';

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to send your enquiry.');

      formStatus.classList.add('is-success');
      formStatus.innerHTML = '<strong>Thank you for your enquiry.</strong><p>We\'ve received the details of your celebration and will be in touch to confirm availability and prepare your personalised quote.</p><p>Please note that submitting an enquiry does not reserve your event date.</p>';
      formStatus.focus();
      eventEnquiryForm.reset();
      delete eventDate.dataset.value;
      updateOutdoorSurface();
    } catch (error) {
      formStatus.textContent = `${error.message} Please try again or email hello@audoraco.com.au.`;
      formStatus.focus();
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Make an Enquiry';
    }
  });
};

fetch('/api/availability', { headers: { Accept: 'application/json' } })
  .then((response) => {
    if (!response.ok) throw new Error('Availability is unavailable.');
    return response.json();
  })
  .then((configuration) => {
    if (configuration.enquiriesEnabled) initialiseEnquiryForm(configuration.blockedDates || []);
  })
  .catch(() => {
    // Fail closed: the opening notice stays visible and the form stays hidden.
  });
