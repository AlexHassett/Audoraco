const eventEnquiryForm = document.querySelector('#event-enquiry-form');
const earliestEventDate = '2026-10-31';
const enquiryEndpoint = 'https://formsubmit.co/hello@audoraco.com.au';
const automaticReply = 'Thank you for your enquiry with Audora Co. We have received the details of your celebration and will be in touch to confirm availability and prepare your personalised quote. Please note that submitting an enquiry does not reserve your event date. If you need to add anything, reply to this email or contact hello@audoraco.com.au.';

const initialiseEnquiryForm = (blockedDates) => {
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
  const packagePreference = eventEnquiryForm.querySelector('#package-preference');
  const bigPlaySizeField = eventEnquiryForm.querySelector('#big-play-size-field');
  const bigPlaySize = eventEnquiryForm.querySelector('#big-play-size');
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
      const isPast = date < today || isoDate < earliestEventDate;
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
    if (duration > 240) durationMessage.textContent = 'Our standard package includes 4 hours of playtime. Additional playtime may be available for an extra fee, subject to availability.';
  };

  const validatePhone = () => {
    const compactPhone = phone.value.replace(/[\s()-]/g, '');
    const isValid = /^(?:\+?61|0)[2-478]\d{8}$/.test(compactPhone);
    phone.setCustomValidity(!phone.value || isValid ? '' : 'Please enter a valid Australian phone number.');
  };

  const updateBigPlaySize = () => {
    const isBigPlay = packagePreference.value.startsWith('Big Play');
    bigPlaySizeField.hidden = !isBigPlay;
    bigPlaySize.disabled = !isBigPlay;
    bigPlaySize.required = isBigPlay;
    packagePreference.setAttribute('aria-expanded', String(isBigPlay));
    if (!isBigPlay) bigPlaySize.value = '';
  };

  eventSetting.addEventListener('change', updateOutdoorSurface);
  startTime.addEventListener('change', validateTimes);
  finishTime.addEventListener('change', validateTimes);
  phone.addEventListener('input', validatePhone);
  packagePreference.addEventListener('change', updateBigPlaySize);
  updateOutdoorSurface();

  const subject = new URLSearchParams(window.location.search).get('subject')?.toLowerCase() || '';
  const subjectPackage = [...packagePreference.options].find((option) => subject.includes(option.textContent.split(' — ')[0].toLowerCase()));
  if (subjectPackage) packagePreference.value = subjectPackage.value;
  updateBigPlaySize();

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
    const formData = Object.fromEntries(new FormData(eventEnquiryForm).entries());
    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
    formStatus.classList.remove('is-success');
    formStatus.textContent = 'Opening secure submission…';

    const setHiddenField = (name, value) => {
      let field = eventEnquiryForm.querySelector(`input[name="${name}"]`);
      if (!field) {
        field = document.createElement('input');
        field.type = 'hidden';
        field.name = name;
        eventEnquiryForm.append(field);
      }
      field.value = value;
    };

    setHiddenField('_subject', `Soft play enquiry — ${eventDate.dataset.value} — ${formData.fullName}`);
    setHiddenField('_template', 'table');
    setHiddenField('_autoresponse', automaticReply);
    setHiddenField('_replyto', formData.email);
    setHiddenField('_next', new URL('enquiry-thank-you.html', window.location.href).href);
    setHiddenField('Event date (ISO)', eventDate.dataset.value);

    eventEnquiryForm.action = enquiryEndpoint;
    eventEnquiryForm.method = 'POST';
    eventEnquiryForm.submit();
  });
};

fetch('availability.json', { headers: { Accept: 'application/json' }, cache: 'no-store' })
  .then((response) => {
    if (!response.ok) throw new Error('Availability is unavailable.');
    return response.json();
  })
  .then((configuration) => {
    initialiseEnquiryForm(configuration.blockedDates || []);
  })
  .catch(() => {
    initialiseEnquiryForm([]);
  });
