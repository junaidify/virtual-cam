(function () {
  if (window.__VIRTUALCAM_INSTALLED__) return;
  window.__VIRTUALCAM_INSTALLED__ = true;

  var _real = navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    ? navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
    : null;
  if (!_real) return;

  function createStream(dataUrl, constraints) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var w = 640, h = 480;
        if (constraints && constraints.video && typeof constraints.video === 'object') {
          var v = constraints.video;
          if (v.width) w = v.width.ideal || v.width.exact || v.width.max || (typeof v.width === 'number' ? v.width : 640);
          if (v.height) h = v.height.ideal || v.height.exact || v.height.max || (typeof v.height === 'number' ? v.height : 480);
        }
        w = parseInt(w) || 640;
        h = parseInt(h) || 480;

        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d', { willReadFrequently: true });

        var total = w * h, noiseCount = Math.floor(total * 0.01), indices = [];
        for (var i = 0; i < noiseCount; i++) indices.push(Math.floor(Math.random() * total) * 4);

        var running = true, frame;
        function draw() {
          if (!running) return;
          ctx.drawImage(img, 0, 0, w, h);
          try {
            var d = ctx.getImageData(0, 0, w, h), px = d.data;
            for (var j = 0; j < indices.length; j++) {
              var idx = indices[j];
              if (idx + 2 < px.length) {
                var n = (Math.random() - 0.5) * 4;
                px[idx] = Math.max(0, Math.min(255, px[idx] + n));
                px[idx+1] = Math.max(0, Math.min(255, px[idx+1] + n));
                px[idx+2] = Math.max(0, Math.min(255, px[idx+2] + n));
              }
            }
            ctx.putImageData(d, 0, 0);
          } catch (e) {}
          frame = requestAnimationFrame(draw);
        }
        draw();

        var stream = canvas.captureStream(30);
        var track = stream.getVideoTracks()[0];
        if (track) {
          var _stop = track.stop.bind(track);
          track.stop = function () { running = false; cancelAnimationFrame(frame); _stop(); };
        }
        resolve(stream);
      };
      img.onerror = function () { _real(constraints).then(resolve).catch(reject); };
      img.src = dataUrl;
    });
  }

  function virtualGetUserMedia(constraints) {
    var enabled = localStorage.getItem('__virtualcam_enabled');
    var image = localStorage.getItem('__virtualcam_image');

    if (enabled === 'true' && image && constraints && constraints.video) {
      return createStream(image, constraints).then(function (s) {
        if (constraints.audio) {
          return _real({ audio: constraints.audio }).then(function (a) {
            a.getAudioTracks().forEach(function (t) { s.addTrack(t); });
            return s;
          }).catch(function () { return s; });
        }
        return s;
      });
    }
    return _real(constraints);
  }

  try {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      value: virtualGetUserMedia, writable: true, configurable: true, enumerable: true
    });
  } catch (e) {
    navigator.mediaDevices.getUserMedia = virtualGetUserMedia;
  }

  if (navigator.getUserMedia) {
    navigator.getUserMedia = function (c, s, e) { virtualGetUserMedia(c).then(s).catch(e); };
  }
  if (navigator.webkitGetUserMedia) {
    navigator.webkitGetUserMedia = function (c, s, e) { virtualGetUserMedia(c).then(s).catch(e); };
  }
})();
