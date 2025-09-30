const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

const defaultHeaders = {
  'Content-Type': 'application/json',
};

export const generatePersonalizedContent = async ({ userId, forceRegenerate = false }) => {
  if (!userId) {
    throw new Error('generatePersonalizedContent requires a userId');
  }

  const response = await fetch(`${backendUrl}/api/personalization/generate`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ userId, forceRegenerate }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error?.error || 'Failed to generate personalized content';
    const details = error?.details || error?.raw;
    const err = new Error(message);
    err.details = details;
    throw err;
  }

  return response.json();
};

export default {
  generatePersonalizedContent,
};
