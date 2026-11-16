// Penyimpanan kecil: pakai chrome.storage kalau tersedia, fallback ke localStorage.
const hasChromeStorage = (() => {
  try {
    return typeof chrome !== "undefined" && !!chrome.storage && !!chrome.storage.local;
  } catch {
    return false;
  }
})();

const PREFIX = "sidebar-arcade:";

export async function get(key, fallback = null) {
  try {
    if (hasChromeStorage) {
      const res = await chrome.storage.local.get(key);
      return key in res ? res[key] : fallback;
    }
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function set(key, value) {
  try {
    if (hasChromeStorage) {
      await chrome.storage.local.set({ [key]: value });
      return;
    }
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage bisa gagal (quota/private mode) — game tetap jalan */
  }
}
