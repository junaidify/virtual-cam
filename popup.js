(function () {
  var uploadArea = document.getElementById('uploadArea');
  var uploadContent = document.getElementById('uploadContent');
  var previewImage = document.getElementById('previewImage');
  var fileInput = document.getElementById('fileInput');
  var toggleSwitch = document.getElementById('toggleSwitch');
  var clearBtn = document.getElementById('clearBtn');
  var uploadBtn = document.getElementById('uploadBtn');
  var statusBadge = document.getElementById('statusBadge');
  var MAX_SIZE = 5 * 1024 * 1024;

  function init() {
    chrome.storage.local.get(['virtualcam_enabled', 'virtualcam_image'], function (data) {
      var enabled = data.virtualcam_enabled !== false;
      toggleSwitch.checked = enabled;
      if (data.virtualcam_image) { showPreview(data.virtualcam_image); clearBtn.disabled = false; }
      updateBadge(enabled, !!data.virtualcam_image);
    });

    uploadArea.addEventListener('click', function () { fileInput.click(); });
    uploadBtn.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function (e) { if (e.target.files[0]) processFile(e.target.files[0]); fileInput.value = ''; });

    uploadArea.addEventListener('dragover', function (e) { e.preventDefault(); uploadArea.classList.add('drag-over'); });
    uploadArea.addEventListener('dragleave', function (e) { e.preventDefault(); uploadArea.classList.remove('drag-over'); });
    uploadArea.addEventListener('drop', function (e) {
      e.preventDefault(); uploadArea.classList.remove('drag-over');
      if (e.dataTransfer.files.length > 0) processFile(e.dataTransfer.files[0]);
    });

    toggleSwitch.addEventListener('change', function () {
      var on = toggleSwitch.checked;
      chrome.storage.local.set({ virtualcam_enabled: on }, function () {
        chrome.storage.local.get(['virtualcam_image'], function (d) { updateBadge(on, !!d.virtualcam_image); });
        toast(on ? 'Virtual camera enabled' : 'Virtual camera disabled');
      });
    });

    clearBtn.addEventListener('click', function () {
      chrome.storage.local.set({ virtualcam_image: null }, function () {
        hidePreview(); clearBtn.disabled = true;
        updateBadge(toggleSwitch.checked, false); toast('Image cleared');
      });
    });
  }

  function processFile(file) {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { toast('Only JPG, PNG, WEBP supported', 'error'); return; }
    if (file.size > MAX_SIZE) { toast('Image must be under 5MB', 'error'); return; }
    var reader = new FileReader();
    reader.onload = function (e) { resize(e.target.result, 640, 480, function (img) {
      chrome.storage.local.set({ virtualcam_image: img }, function () {
        showPreview(img); clearBtn.disabled = false;
        updateBadge(toggleSwitch.checked, true); toast('Image uploaded! Refresh target page.');
      });
    }); };
    reader.readAsDataURL(file);
  }

  function resize(dataUrl, tw, th, cb) {
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas'); c.width = tw; c.height = th;
      var ctx = c.getContext('2d');
      var s = Math.max(tw / img.width, th / img.height);
      ctx.drawImage(img, (tw - img.width * s) / 2, (th - img.height * s) / 2, img.width * s, img.height * s);
      cb(c.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = function () { cb(dataUrl); };
    img.src = dataUrl;
  }

  function showPreview(url) { previewImage.src = url; previewImage.style.display = 'block'; uploadContent.style.display = 'none'; uploadArea.classList.add('has-image'); }
  function hidePreview() { previewImage.src = ''; previewImage.style.display = 'none'; uploadContent.style.display = 'flex'; uploadArea.classList.remove('has-image'); }

  function updateBadge(enabled, hasImage) {
    var active = enabled && hasImage;
    statusBadge.className = 'status-badge ' + (active ? 'active' : 'inactive');
    statusBadge.querySelector('.status-text').textContent = active ? 'Active' : 'Inactive';
  }

  function toast(msg, type) {
    var el = document.querySelector('.toast'); if (el) el.remove();
    var t = document.createElement('div'); t.className = 'toast ' + (type || 'success'); t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 2500);
  }

  init();
})();
