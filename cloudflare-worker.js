const allowedOrigins = new Set([
  'https://alexhassett.github.io',
  'https://audoraco.com.au',
  'https://www.audoraco.com.au',
]);

const requiredFields = [
  'eventDate', 'eventStartTime', 'eventFinishTime', 'eventSuburb',
  'eventPostcode', 'eventSetting', 'venueAccess', 'packagePreference',
  'colourPalette', 'fullName', 'email', 'phone',
];

const fieldLabels = {
  eventDate: 'Event date',
  eventStartTime: 'Event start time',
  eventFinishTime: 'Event finish time',
  venueName: 'Venue name',
  eventSuburb: 'Event suburb',
  eventPostcode: 'Event postcode',
  venueAddress: 'Venue address',
  eventSetting: 'Event setting',
  surfaceType: 'Surface type',
  occasion: 'Occasion',
  venueAccess: 'Venue access',
  littleGuests: 'Approx. number of children',
  parkingNotes: 'Parking / loading notes',
  packagePreference: 'Package preference',
  bigPlaySize: 'Preferred Big Play setup size',
  colourPalette: 'Colour palette',
  additionalDetails: 'Additional details',
  fullName: 'Name',
  email: 'Email',
  phone: 'Mobile number',
  preferredContactMethod: 'Preferred contact method',
};

const clean = (value = '') => String(value).trim().slice(0, 4000);
const escapeHtml = (value = '') => clean(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://audoraco.com.au',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
    'Vary': 'Origin',
  };
}

function json(origin, body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS') {
      if (!allowedOrigins.has(origin)) return json(origin, { error: 'Origin not allowed.' }, 403);
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method === 'GET') return json(origin, { ok: true, service: 'Audora enquiry API' });
    if (request.method !== 'POST') return json(origin, { error: 'Method not allowed.' }, 405);
    if (!allowedOrigins.has(origin)) return json(origin, { error: 'Origin not allowed.' }, 403);
    if (!env.RESEND_API_KEY || !env.ENQUIRY_FROM_EMAIL || !env.ENQUIRY_RECIPIENT) {
      return json(origin, { error: 'The enquiry service is not configured.' }, 503);
    }

    let submitted;
    try {
      submitted = await request.json();
    } catch {
      return json(origin, { error: 'Invalid enquiry data.' }, 400);
    }

    if (submitted.website) return json(origin, { ok: true });
    const data = Object.fromEntries(Object.entries(submitted).map(([key, value]) => [key, clean(value)]));

    if (requiredFields.some((field) => !data[field])) {
      return json(origin, { error: 'Please complete all required fields.' }, 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.eventDate) || data.eventDate < new Date().toISOString().slice(0, 10)) {
      return json(origin, { error: 'Please select a valid future event date.' }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return json(origin, { error: 'Please enter a valid email address.' }, 400);
    }
    const compactPhone = data.phone.replace(/[\s()-]/g, '');
    if (!/^(?:\+?61|0)[2-478]\d{8}$/.test(compactPhone) || !/^\d{4}$/.test(data.eventPostcode)) {
      return json(origin, { error: 'Please check the supplied phone number and postcode.' }, 400);
    }
    if (data.eventFinishTime <= data.eventStartTime || (data.eventSetting === 'outdoors' && !data.surfaceType)) {
      return json(origin, { error: 'Please check the event times and outdoor surface details.' }, 400);
    }

    const rows = Object.entries(fieldLabels)
      .filter(([key]) => data[key])
      .map(([key, label]) => `<tr><th align="left" style="padding:8px 18px 8px 0;color:#746860;vertical-align:top">${escapeHtml(label)}</th><td style="padding:8px 0;white-space:pre-wrap">${escapeHtml(data[key])}</td></tr>`)
      .join('');

    const internalHtml = `<div style="font-family:Arial,sans-serif;color:#4f4640"><h1 style="font-family:Georgia,serif;font-weight:400">New Audora Play enquiry</h1><table style="border-collapse:collapse">${rows}</table><p style="margin-top:24px;color:#756a63">This enquiry does not reserve the event date.</p></div>`;
    const confirmationHtml = `<div style="max-width:620px;margin:auto;padding:36px 24px;font-family:Arial,sans-serif;color:#4f4640"><h1 style="font-family:Georgia,serif;font-weight:400;font-size:34px">Thank you for your enquiry.</h1><p style="line-height:1.7">Hi ${escapeHtml(data.fullName)},</p><p style="line-height:1.7">We've received the details of your celebration and will be in touch to confirm availability and prepare your personalised quote.</p><p style="line-height:1.7">Please note that submitting an enquiry does not reserve your event date.</p><p style="margin-top:30px;line-height:1.7">Warmly,<br><strong>Audora Co</strong><br>hello@audoraco.com.au</p></div>`;

    const resendResponse = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          from: env.ENQUIRY_FROM_EMAIL,
          to: [env.ENQUIRY_RECIPIENT],
          reply_to: data.email,
          subject: `Soft play enquiry — ${data.eventDate} — ${data.fullName}`,
          html: internalHtml,
        },
        {
          from: env.ENQUIRY_FROM_EMAIL,
          to: [data.email],
          reply_to: env.ENQUIRY_RECIPIENT,
          subject: 'We’ve received your Audora Co enquiry',
          html: confirmationHtml,
        },
      ]),
    });

    if (!resendResponse.ok) {
      console.error('Resend rejected the enquiry batch.', resendResponse.status);
      return json(origin, { error: 'Your enquiry could not be sent. Please try again.' }, 502);
    }

    return json(origin, { ok: true });
  },
};
