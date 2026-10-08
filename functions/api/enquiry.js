import { getAvailabilityConfiguration } from '../_shared/availability.js';

const recipient = 'hello@audoraco.com.au';
const requiredFields = ['eventDate', 'eventStartTime', 'eventFinishTime', 'eventSuburb', 'eventPostcode', 'eventSetting', 'venueAccess', 'packagePreference', 'colourPalette', 'fullName', 'email', 'phone'];
const validPackages = new Set(['Little Play — 2m × 3m — $400', 'Classic Play — 3m × 4m — $550']);
const validColours = new Set(['All White', 'Pink', 'Blue', 'Green']);

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const clean = (value = '') => String(value).trim().slice(0, 4000);

const fieldRows = [
  ['Event date', 'eventDate'],
  ['Event time', 'eventTime'],
  ['Venue name', 'venueName'],
  ['Event suburb', 'eventSuburb'],
  ['Event postcode', 'eventPostcode'],
  ['Venue address', 'venueAddress'],
  ['Event setting', 'eventSetting'],
  ['Surface type', 'surfaceType'],
  ['Occasion', 'occasion'],
  ['Venue access', 'venueAccess'],
  ['Approx. number of children', 'littleGuests'],
  ['Parking / loading notes', 'parkingNotes'],
  ['Package preference', 'packagePreference'],
  ['Colour palette', 'colourPalette'],
  ['Additional details', 'additionalDetails'],
  ['Name', 'fullName'],
  ['Email', 'email'],
  ['Mobile number', 'phone'],
  ['Preferred contact method', 'preferredContactMethod'],
];

export async function onRequestPost({ request, env }) {
  const availability = await getAvailabilityConfiguration(env);
  if (!availability.enquiriesEnabled) {
    return Response.json({ error: 'Enquiries are not currently open.' }, { status: 403 });
  }

  if (!env.RESEND_API_KEY || !env.ENQUIRY_FROM_EMAIL) {
    return Response.json({ error: 'The enquiry service is not configured.' }, { status: 503 });
  }

  let submitted;
  try {
    submitted = await request.json();
  } catch {
    return Response.json({ error: 'Invalid enquiry data.' }, { status: 400 });
  }

  const data = Object.fromEntries(Object.entries(submitted).map(([key, value]) => [key, clean(value)]));
  if (requiredFields.some((field) => !data[field])) {
    return Response.json({ error: 'Please complete all required fields.' }, { status: 400 });
  }

  const todayParts = Object.fromEntries(new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  const localToday = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.eventDate) || data.eventDate < localToday || availability.blockedDates.includes(data.eventDate)) {
    return Response.json({ error: 'That event date is unavailable. Please select another date.' }, { status: 409 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const compactPhone = data.phone.replace(/[\s()-]/g, '');
  if (!/^(?:\+?61|0)[2-478]\d{8}$/.test(compactPhone) || !/^\d{4}$/.test(data.eventPostcode)) {
    return Response.json({ error: 'Please check the supplied phone number and postcode.' }, { status: 400 });
  }

  if (!validPackages.has(data.packagePreference) || !validColours.has(data.colourPalette)) {
    return Response.json({ error: 'Please select a valid package and colour palette.' }, { status: 400 });
  }

  if (data.eventFinishTime <= data.eventStartTime || (data.eventSetting === 'outdoors' && !data.surfaceType)) {
    return Response.json({ error: 'Please check the event times and outdoor surface details.' }, { status: 400 });
  }

  data.eventTime = `${data.eventStartTime}–${data.eventFinishTime}`;
  const rows = fieldRows
    .filter(([, key]) => data[key])
    .map(([label, key]) => `<tr><th align="left" style="padding:8px 16px 8px 0;vertical-align:top;color:#665c55">${escapeHtml(label)}</th><td style="padding:8px 0;white-space:pre-wrap">${escapeHtml(data[key])}</td></tr>`)
    .join('');
  const text = fieldRows
    .filter(([, key]) => data[key])
    .map(([label, key]) => `${label}: ${data[key]}`)
    .join('\n');

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.ENQUIRY_FROM_EMAIL,
      to: [recipient],
      reply_to: data.email,
      subject: `Soft play enquiry — ${data.eventDate} — ${data.fullName}`,
      html: `<div style="font-family:Arial,sans-serif;color:#4f4640"><h1 style="font-family:Georgia,serif;font-weight:400">New Audora Play enquiry</h1><table style="border-collapse:collapse">${rows}</table><p style="margin-top:24px;color:#756a63">This enquiry does not reserve or block the event date.</p></div>`,
      text: `New Audora Play enquiry\n\n${text}\n\nThis enquiry does not reserve or block the event date.`,
    }),
  });

  if (!resendResponse.ok) {
    console.error('Resend rejected the enquiry email.', await resendResponse.text());
    return Response.json({ error: 'Your enquiry could not be sent.' }, { status: 502 });
  }

  return Response.json({ ok: true });
}

export function onRequestGet() {
  return Response.json({ error: 'Method not allowed.' }, { status: 405, headers: { Allow: 'POST' } });
}
