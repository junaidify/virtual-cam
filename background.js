chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({ virtualcam_enabled: true, virtualcam_image: null });
  }
});

function injectOverride(tabId) {
  chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    files: ['inject.js'],
    world: 'MAIN',
  }).catch(() => {});
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') injectOverride(tabId);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => { if (tab.id) injectOverride(tab.id); });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_STATUS') {
    chrome.storage.local.get(['virtualcam_enabled', 'virtualcam_image'], (data) => {
      sendResponse({ enabled: data.virtualcam_enabled ?? true, hasImage: !!data.virtualcam_image });
    });
    return true;
  }
});
