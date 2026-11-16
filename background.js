// Sidebar Arcade — service worker
// Tugasnya cuma satu: bikin klik ikon extension langsung membuka side panel.

async function enableActionClick() {
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (err) {
    console.warn("[Sidebar Arcade] gagal set panel behavior:", err);
  }
}

chrome.runtime.onInstalled.addListener(enableActionClick);
chrome.runtime.onStartup.addListener(enableActionClick);
enableActionClick();
