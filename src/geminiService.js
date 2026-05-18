// FitScan AI Service — All Gemini calls are now proxied through the backend server.
// This avoids CORS issues, keeps the API key secure, and allows server-side retry logic.

const BACKEND_URL = 'http://localhost:5000';

export async function analyzeFoodImage(imageBase64, userProfile, authToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${BACKEND_URL}/api/analyze/image`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ imageBase64, userProfile }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  return response.json();
}

export async function analyzeFoodText(productData, userProfile) {
  const response = await fetch(`${BACKEND_URL}/api/analyze/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productData, userProfile }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  return response.json();
}
