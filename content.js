(function () {
  function bridgeToPage() {
    chrome.storage.local.get(['virtualcam_enabled', 'virtualcam_image'], function (data) {
      try {
        if (data.virtualcam_image) {
          localStorage.setItem('__virtualcam_image', data.virtualcam_image);
        } else {
          localStorage.removeItem('__virtualcam_image');
        }
        localStorage.setItem('__virtualcam_enabled', data.virtualcam_enabled !== false ? 'true' : 'false');
      } catch (e) {}
    });
  }

  bridgeToPage();
  chrome.storage.onChanged.addListener(function (changes, area) {
    if (area === 'local') bridgeToPage();
  });
})();
