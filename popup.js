(function () {
  var uploadArea = document.getElementById('uploadArea');
  var uploadContent = document.getElementById('uploadContent');
  var previewImage = document.getElementById('previewImage');
  var cameraWrapper = document.getElementById('cameraWrapper');
  var cameraVideo = document.getElementById('cameraVideo');
  var fileInput = document.getElementById('fileInput');
  var toggleSwitch = document.getElementById('toggleSwitch');
  var clearBtn = document.getElementById('clearBtn');
  var uploadBtn = document.getElementById('uploadBtn');
  var startCameraBtn = document.getElementById('startCameraBtn');
  var cancelCameraBtn = document.getElementById('cancelCameraBtn');
  var captureBtn = document.getElementById('captureBtn');
  var standardActions = document.getElementById('standardActions');
  var cameraActions = document.getElementById('cameraActions');
  var statusBadge = document.getElementById('statusBadge');
  
  var MAX_SIZE = 5 * 1024 * 1024;
  var cameraStream = null;
  var isCameraActive = false;

  function init() {
    chrome.storage.local.get(['virtualcam_enabled', 'virtualcam_image'], function (data) {
      var enabled = data.virtualcam_enabled !== false;
      toggleSwitch.checked = enabled;
      if (data.virtualcam_image) {
        showPreview(data.virtualcam_image);
        clearBtn.disabled = false;
      }
      updateBadge(enabled, !!data.virtualcam_image);
    });

    uploadArea.addEventListener('click', function () {
      if (isCameraActive) return;
      fileInput.click();
    });

    uploadBtn.addEventListener('click', function () {
      if (isCameraActive) stopCamera();
      fileInput.click();
    });

    fileInput.addEventListener('change', function (e) {
      if (e.target.files[0]) processFile(e.target.files[0]);
      fileInput.value = '';
    });

    startCameraBtn.addEventListener('click', function () {
      handleTakePhotoClick();
    });

    cancelCameraBtn.addEventListener('click', function () {
      stopCamera();
    });

    captureBtn.addEventListener('click', function () {
      capturePhoto();
    });

    uploadArea.addEventListener('dragover', function (e) {
      if (isCameraActive) return;
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', function (e) {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', function (e) {
      if (isCameraActive) return;
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
    });

    toggleSwitch.addEventListener('change', function () {
      var on = toggleSwitch.checked;
      chrome.storage.local.set({ virtualcam_enabled: on }, function () {
        chrome.storage.local.get(['virtualcam_image'], function (d) {
          updateBadge(on, !!d.virtualcam_image);
        });
        toast(on ? 'Virtual camera enabled' : 'Virtual camera disabled');
      });
    });

    clearBtn.addEventListener('click', function () {
      if (isCameraActive) stopCamera();
      chrome.storage.local.set({ virtualcam_image: null }, function () {
        hidePreview();
        clearBtn.disabled = true;
        updateBadge(toggleSwitch.checked, false);
        toast('Image cleared');
      });
    });

    window.addEventListener('beforeunload', stopCamera);
    window.addEventListener('unload', stopCamera);
  }

  function openCaptureStudio() {
    stopCamera();
    chrome.tabs.create({ url: chrome.runtime.getURL('capture.html') });
    window.close();
  }

  function handleTakePhotoClick() {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' }).then(function (status) {
        if (status.state === 'granted') {
          startCamera();
        } else {
          // If permission is not yet granted, open full studio tab so Chrome's permission prompt doesn't close the popup
          openCaptureStudio();
        }
      }).catch(function () {
        startCamera();
      });
    } else {
      startCamera();
    }
  }

  function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      openCaptureStudio();
      return;
    }

    navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    }).then(function (stream) {
      cameraStream = stream;
      isCameraActive = true;
      cameraVideo.srcObject = stream;
      cameraVideo.play();

      uploadContent.style.display = 'none';
      previewImage.style.display = 'none';
      cameraWrapper.style.display = 'block';
      uploadArea.classList.add('camera-active');

      standardActions.style.display = 'none';
      cameraActions.style.display = 'flex';
    }).catch(function (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        openCaptureStudio();
      } else {
        toast('Could not access camera: ' + (err.message || 'Check camera hardware'), 'error');
        stopCamera();
      }
    });
  }

  function stopCamera() {
    isCameraActive = false;
    if (cameraStream) {
      cameraStream.getTracks().forEach(function (track) {
        track.stop();
      });
      cameraStream = null;
    }

    if (cameraVideo) {
      cameraVideo.srcObject = null;
    }

    if (cameraWrapper) {
      cameraWrapper.style.display = 'none';
    }

    if (uploadArea) {
      uploadArea.classList.remove('camera-active');
    }

    if (cameraActions) {
      cameraActions.style.display = 'none';
    }

    if (standardActions) {
      standardActions.style.display = 'flex';
    }

    chrome.storage.local.get(['virtualcam_image'], function (data) {
      if (data && data.virtualcam_image) {
        showPreview(data.virtualcam_image);
      } else {
        hidePreview();
      }
    });
  }

  function capturePhoto() {
    if (!cameraStream || !cameraVideo.videoWidth) {
      toast('Camera not ready yet', 'error');
      return;
    }

    var vw = cameraVideo.videoWidth || 640;
    var vh = cameraVideo.videoHeight || 480;
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
    ctx.drawImage(cameraVideo, dx, dy, dw, dh);

    var capturedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

    stopCamera();

    chrome.storage.local.set({
      virtualcam_image: capturedDataUrl,
      virtualcam_enabled: true
    }, function () {
      toggleSwitch.checked = true;
      showPreview(capturedDataUrl);
      clearBtn.disabled = false;
      updateBadge(true, true);
      toast('Photo captured & activated! Refresh target page.');
    });
  }

  function processFile(file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast('Only JPG, PNG, WEBP supported', 'error');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast('Image must be under 5MB', 'error');
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      resize(e.target.result, 640, 480, function (img) {
        chrome.storage.local.set({
          virtualcam_image: img,
          virtualcam_enabled: true
        }, function () {
          toggleSwitch.checked = true;
          showPreview(img);
          clearBtn.disabled = false;
          updateBadge(true, true);
          toast('Image uploaded & activated! Refresh target page.');
        });
      });
    };
    reader.readAsDataURL(file);
  }

  function resize(dataUrl, tw, th, cb) {
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas');
      c.width = tw;
      c.height = th;
      var ctx = c.getContext('2d');
      var s = Math.max(tw / img.width, th / img.height);
      ctx.drawImage(img, (tw - img.width * s) / 2, (th - img.height * s) / 2, img.width * s, img.height * s);
      cb(c.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = function () {
      cb(dataUrl);
    };
    img.src = dataUrl;
  }

  function showPreview(url) {
    previewImage.src = url;
    previewImage.style.display = 'block';
    uploadContent.style.display = 'none';
    uploadArea.classList.add('has-image');
  }

  function hidePreview() {
    previewImage.src = '';
    previewImage.style.display = 'none';
    uploadContent.style.display = 'flex';
    uploadArea.classList.remove('has-image');
  }

  function updateBadge(enabled, hasImage) {
    var active = enabled && hasImage;
    statusBadge.className = 'status-badge ' + (active ? 'active' : 'inactive');
    statusBadge.querySelector('.status-text').textContent = active ? 'Active' : 'Inactive';
  }

  function toast(msg, type) {
    var el = document.querySelector('.toast');
    if (el) el.remove();
    var t = document.createElement('div');
    t.className = 'toast ' + (type || 'success');
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () {
      t.classList.add('show');
    });
    setTimeout(function () {
      t.classList.remove('show');
      setTimeout(function () {
        t.remove();
      }, 300);
    }, 2500);
  }

  init();
})();
