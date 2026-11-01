export async function getAvailabilityConfiguration(env) {
  if (!env.AUDORA_CONFIG) return { enquiriesEnabled: true, blockedDates: [] };

  const blockedValue = await env.AUDORA_CONFIG.get('blockedDates', { type: 'json' });

  const blockedDates = Array.isArray(blockedValue)
    ? blockedValue.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    : [];

  return {
    enquiriesEnabled: true,
    blockedDates,
  };
}
