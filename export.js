import { showToast } from './storage.js';

const PREFIX = 'np_';

/** Download all app data as a formatted JSON file. */
export function exportData() {
  const data = {};
  let count = 0;
  Object.keys(localStorage).forEach(k => {
    if (k.startsWith(PREFIX)) {
      const cleanKey = k.slice(PREFIX.length);
      try { data[cleanKey] = JSON.parse(localStorage.getItem(k)); }
      catch { data[cleanKey] = localStorage.getItem(k); }
      count++;
    }
  });

  if (count === 0) {
    showToast('No data to export yet.', 'info');
    return;
  }

  const blob = new Blob([JSON.stringify({ exported: new Date().toISOString(), data }, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nijam-paaku-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`✅ Exported ${count} records`, 'success');
}
