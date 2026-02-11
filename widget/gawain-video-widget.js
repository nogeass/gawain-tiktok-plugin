/**
 * Gawain AI — Embeddable Video Widget for TikTok Shop
 *
 * Interactive video carousel with:
 * - Tap to unmute/mute audio
 * - Tap to play/pause
 * - Fullscreen expand button
 * - Horizontal scrolling carousel
 *
 * Usage:
 *   <div class="gawain-video-section"
 *     data-api-base="https://gawain.nogeass.com"
 *     data-shop-id="YOUR_TIKTOK_SHOP_ID"
 *     data-product-id="OPTIONAL_PRODUCT_ID"
 *     data-heading="Product Videos"
 *     data-video-width="180">
 *   </div>
 *   <link rel="stylesheet" href="gawain-video-widget.css">
 *   <script src="gawain-video-widget.js" defer></script>
 */
(function() {
  'use strict';

  var INIT_ATTR = 'data-gawain-initialized';

  // SVG icons (inline to avoid external deps)
  var ICON_MUTED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
  var ICON_UNMUTED = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>';
  var ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
  var ICON_EXPAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  function initContainer(container) {
    if (container.getAttribute(INIT_ATTR)) return;
    container.setAttribute(INIT_ATTR, '1');

    var apiBase = (container.getAttribute('data-api-base') || 'https://gawain.nogeass.com').replace(/\/+$/, '');
    var shopId = container.getAttribute('data-shop-id');
    var productId = container.getAttribute('data-product-id');
    var heading = container.getAttribute('data-heading') || '\u30D7\u30ED\u30E2\u30FC\u30B7\u30E7\u30F3\u52D5\u753B';
    var videoWidth = parseInt(container.getAttribute('data-video-width') || '180', 10);

    if (!shopId) {
      container.innerHTML = '<p style="color:#999;text-align:center;padding:1rem;">Shop ID not available.</p>';
      return;
    }

    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">\u8AAD\u307F\u8FBC\u307F\u4E2D...</div>';

    var url = apiBase + '/api/tiktok/storefront-videos?shopId=' + encodeURIComponent(shopId);
    if (productId) {
      url += '&productId=' + encodeURIComponent(productId);
    }

    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data || !data.videos || data.videos.length === 0) {
          container.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">' +
            escapeHtml(heading) + '<br><span style="font-size:0.85rem;">\u52D5\u753B\u304C\u307E\u3060\u914D\u7F6E\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002</span></div>';
          return;
        }
        renderCarousel(container, data.videos, heading, videoWidth);
      })
      .catch(function(err) {
        console.error('Gawain video fetch error:', err);
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">' +
          escapeHtml(heading) + '<br><span style="font-size:0.85rem;">\u52D5\u753B\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002</span></div>';
      });
  }

  function renderCarousel(container, videos, heading, videoWidth) {
    var videoHeight = Math.round(videoWidth * 16 / 9);

    var wrapper = document.createElement('div');
    wrapper.className = 'gawain-carousel-wrapper';

    var h3 = document.createElement('h3');
    h3.className = 'gawain-carousel-heading';
    h3.textContent = heading;
    wrapper.appendChild(h3);

    var scroll = document.createElement('div');
    scroll.className = 'gawain-carousel-scroll';
    var track = document.createElement('div');
    track.className = 'gawain-carousel-track';

    for (var i = 0; i < videos.length; i++) {
      var card = createVideoCard(videos[i], videoWidth, videoHeight);
      track.appendChild(card);
    }

    scroll.appendChild(track);
    wrapper.appendChild(scroll);
    container.innerHTML = '';
    container.appendChild(wrapper);
  }

  function createVideoCard(videoData, width, height) {
    var card = document.createElement('div');
    card.className = 'gawain-video-card';
    card.style.width = width + 'px';

    // Video wrapper (relative for overlay positioning)
    var videoWrap = document.createElement('div');
    videoWrap.className = 'gawain-video-wrap';
    videoWrap.style.width = width + 'px';
    videoWrap.style.height = height + 'px';

    var video = document.createElement('video');
    video.src = videoData.url;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.className = 'gawain-video-player';
    video.style.width = width + 'px';
    video.style.height = height + 'px';
    videoWrap.appendChild(video);

    // Controls overlay
    var overlay = document.createElement('div');
    overlay.className = 'gawain-video-overlay';

    // Center play/pause indicator (shown briefly on tap)
    var centerIcon = document.createElement('div');
    centerIcon.className = 'gawain-center-icon';
    centerIcon.innerHTML = ICON_PAUSE;
    overlay.appendChild(centerIcon);

    // Mute button (bottom-left)
    var muteBtn = document.createElement('button');
    muteBtn.className = 'gawain-ctrl-btn gawain-mute-btn';
    muteBtn.innerHTML = ICON_MUTED;
    muteBtn.setAttribute('aria-label', '\u97F3\u58F0\u5207\u308A\u66FF\u3048');
    overlay.appendChild(muteBtn);

    // Expand/fullscreen button (bottom-right)
    var expandBtn = document.createElement('button');
    expandBtn.className = 'gawain-ctrl-btn gawain-expand-btn';
    expandBtn.innerHTML = ICON_EXPAND;
    expandBtn.setAttribute('aria-label', '\u62E1\u5927\u8868\u793A');
    overlay.appendChild(expandBtn);

    videoWrap.appendChild(overlay);
    card.appendChild(videoWrap);

    // Title bar
    if (videoData.title) {
      var titleEl = document.createElement('div');
      titleEl.className = 'gawain-video-title';
      titleEl.textContent = videoData.title;
      card.appendChild(titleEl);
    }

    // === Event handlers ===

    // Tap on video area: toggle play/pause + unmute on first tap
    var firstTap = true;
    videoWrap.addEventListener('click', function(e) {
      // Don't trigger if clicking on buttons
      if (e.target.closest('.gawain-ctrl-btn')) return;

      if (firstTap && video.muted) {
        // First tap: unmute
        video.muted = false;
        muteBtn.innerHTML = ICON_UNMUTED;
        muteBtn.classList.add('gawain-active');
        firstTap = false;
        showCenterIcon(centerIcon, ICON_UNMUTED);
        return;
      }

      // Subsequent taps: toggle play/pause
      if (video.paused) {
        video.play();
        showCenterIcon(centerIcon, ICON_PLAY);
      } else {
        video.pause();
        showCenterIcon(centerIcon, ICON_PAUSE);
      }
    });

    // Mute button
    muteBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      video.muted = !video.muted;
      if (video.muted) {
        muteBtn.innerHTML = ICON_MUTED;
        muteBtn.classList.remove('gawain-active');
      } else {
        muteBtn.innerHTML = ICON_UNMUTED;
        muteBtn.classList.add('gawain-active');
        firstTap = false;
      }
    });

    // Expand button: fullscreen modal
    expandBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      openFullscreen(videoData, video.muted, video.currentTime);
    });

    return card;
  }

  function showCenterIcon(el, iconSvg) {
    el.innerHTML = iconSvg;
    el.classList.remove('gawain-fade');
    // Force reflow
    void el.offsetWidth;
    el.classList.add('gawain-fade');
  }

  // === Fullscreen Modal ===
  function openFullscreen(videoData, wasMuted, currentTime) {
    // Pause all other videos
    var allVideos = document.querySelectorAll('.gawain-video-player');
    allVideos.forEach(function(v) { v.pause(); });

    var backdrop = document.createElement('div');
    backdrop.className = 'gawain-modal-backdrop';

    var modal = document.createElement('div');
    modal.className = 'gawain-modal';

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.className = 'gawain-modal-close';
    closeBtn.innerHTML = ICON_CLOSE;
    closeBtn.setAttribute('aria-label', '\u9589\u3058\u308B');
    modal.appendChild(closeBtn);

    // Video
    var video = document.createElement('video');
    video.src = videoData.url;
    video.autoplay = true;
    video.loop = true;
    video.muted = wasMuted;
    video.playsInline = true;
    video.controls = true;
    video.className = 'gawain-modal-video';
    video.currentTime = currentTime;
    modal.appendChild(video);

    // Title
    if (videoData.title) {
      var title = document.createElement('div');
      title.className = 'gawain-modal-title';
      title.textContent = videoData.title;
      modal.appendChild(title);
    }

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    function close() {
      document.body.removeChild(backdrop);
      document.body.style.overflow = '';
      // Resume carousel videos
      var carouselVideos = document.querySelectorAll('.gawain-video-player');
      carouselVideos.forEach(function(v) { v.play(); });
    }

    closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) close();
    });

    // ESC key
    var escHandler = function(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initAll() {
    var containers = document.querySelectorAll('.gawain-video-section:not([' + INIT_ATTR + '])');
    containers.forEach(initContainer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  if (typeof MutationObserver !== 'undefined') {
    var observer = new MutationObserver(function(mutations) {
      var found = false;
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          if (added[j].nodeType === 1) {
            if (added[j].classList && added[j].classList.contains('gawain-video-section')) {
              found = true;
            } else if (added[j].querySelector && added[j].querySelector('.gawain-video-section')) {
              found = true;
            }
          }
        }
      }
      if (found) initAll();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
