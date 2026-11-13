(function () {
  var video = document.getElementById('studioVideo');
  var snapBtn = document.getElementById('snapBtn');
  var closeTabBtn = document.getElementById('closeTabBtn');
  var retryPermissionBtn = document.getElementById('retryPermissionBtn');
  var permissionPrompt = document.getElementById('permissionPrompt');
  var cameraBadge = document.getElementById('cameraBadge');
  var badgeText = document.getElementById('badgeText');
  var flashOverlay = document.getElementById('flashOverlay');
  var successMessage = document.getElementById('successMessage');
  var studioControls = document.getElementById('studioControls');

  var stream = null;

  function initCamera() {
    permissionPrompt.style.display = 'none';
    badgeText.textContent = 'CONNECTING CAMERA...';

    navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    }).then(function (mediaStream) {
      stream = mediaStream;
      video.srcObject = mediaStream;
      video.play();
      badgeText.textContent = 'LIVE WEBCAM';
      snapBtn.disabled = false;
    }).catch(function (err) {
      console.error('Camera access error:', err);
      permissionPrompt.style.display = 'flex';
      badgeText.textContent = 'PERMISSION REQUIRED';
      snapBtn.disabled = true;
    });
  }

  function capturePhoto() {
    if (!stream || !video.videoWidth) return;

    // Visual shutter flash effect
    flashOverlay.classList.add('flash');
    setTimeout(function () {
      flashOverlay.classList.remove('flash');
    }, 120);

    var vw = video.videoWidth || 640;
    var vh = video.videoHeight || 480;
    var tw = 640, th = 480;

    var canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    var ctx = canvas.getContext('2d');

    // Mirror horizontally so the captured photo matches the mirrored viewfinder
    ctx.translate(tw, 0);
    ctx.scale(-1, 1);

    var s = Math.max(tw / vw, th / vh);
    var dw = vw * s;
    var dh = vh * s;
    var dx = (tw - dw) / 2;
    var dy = (th - dh) / 2;
    ctx.drawImage(video, dx, dy, dw, dh);

    var capturedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

    // Stop real webcam tracks immediately
    stopCamera();

    // Persist to extension storage and auto-enable virtual camera
    chrome.storage.local.set({
      virtualcam_image: capturedDataUrl,
      virtualcam_enabled: true
    }, function () {
      studioControls.style.display = 'none';
      successMessage.style.display = 'flex';
      setTimeout(function () {
        window.close();
      }, 1200);
    });
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(function (track) {
        track.stop();
      });
      stream = null;
    }
    if (video) {
      video.srcObject = null;
    }
  }

  snapBtn.addEventListener('click', capturePhoto);
  closeTabBtn.addEventListener('click', function () {
    stopCamera();
    window.close();
  });
  retryPermissionBtn.addEventListener('click', initCamera);

  window.addEventListener('beforeunload', stopCamera);
  window.addEventListener('unload', stopCamera);

  initCamera();
})();
