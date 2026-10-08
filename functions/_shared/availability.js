export async function getAvailabilityConfiguration(env) {
  if (!env.AUDORA_CONFIG) return { enquiriesEnabled: false, blockedDates: [] };

  const [enabledValue, blockedValue] = await Promise.all([
    env.AUDORA_CONFIG.get('enquiriesEnabled'),
    env.AUDORA_CONFIG.get('blockedDates', { type: 'json' }),
  ]);

  const blockedDates = Array.isArray(blockedValue)
    ? blockedValue.filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    : [];

  return {
    enquiriesEnabled: enabledValue === 'true',
    blockedDates,
  };
}
