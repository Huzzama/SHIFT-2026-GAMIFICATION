// FARO background service worker.
// Kept deliberately thin: the extension UI is the panel, business logic belongs
// in the FARO backend. This only opens the side panel from the toolbar icon.
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('[FARO] side panel setup failed', error))
