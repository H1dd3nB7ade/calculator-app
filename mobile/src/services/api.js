const API_BASE_URL = 'https://calculator-backend-cwvd.onrender.com/api';

export async function fetchHistory() {
  try {
    const res = await fetch(`${API_BASE_URL}/history`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return await res.json();
  } catch (err) {
    console.warn('fetchHistory error:', err.message);
    return [];
  }
}

export async function saveHistoryEntry({ expression, result, type }) {
  try {
    const res = await fetch(`${API_BASE_URL}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expression, result, type }),
    });
    if (!res.ok) throw new Error('Failed to save history entry');
    return await res.json();
  } catch (err) {
    console.warn('saveHistoryEntry error:', err.message);
    return null;
  }
}

export async function clearHistory() {
  try {
    const res = await fetch(`${API_BASE_URL}/history`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear history');
    return await res.json();
  } catch (err) {
    console.warn('clearHistory error:', err.message);
    return null;
  }
}
