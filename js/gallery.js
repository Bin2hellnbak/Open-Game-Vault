// Initialize immediately if DOM is already ready, otherwise on DOMContentLoaded
(function () {
  const start = () => {
    const galleries = document.querySelectorAll('.gallery');
    const isIndex = document.documentElement.getAttribute('data-page') === 'index';
    const isMobileLike = () => (
      (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches)
      || (window.innerWidth <= 600)
    );

    // Build lightbox UI once
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    document.body.appendChild(lightbox);

    const lightboxImage = document.createElement('img');
    const lightboxVideo = document.createElement('video');
    lightboxVideo.controls = true;
    lightboxVideo.style.maxWidth = '90%';
    lightboxVideo.style.maxHeight = '80%';
    lightbox.appendChild(lightboxImage);
    lightbox.appendChild(lightboxVideo);

    const controls = document.createElement('div');
    controls.className = 'controls';
    lightbox.appendChild(controls);

    const prevArrow = document.createElement('span');
    prevArrow.className = 'arrow';
    prevArrow.textContent = '❮';
    controls.appendChild(prevArrow);

    const nextArrow = document.createElement('span');
    nextArrow.className = 'arrow';
    nextArrow.textContent = '❯';
    controls.appendChild(nextArrow);

    // Thumbs strip and helpers
    let thumbs = document.createElement('div');
    thumbs.className = 'thumbs';
    lightbox.appendChild(thumbs);

    let currentGallery = [];
    let currentIndex = 0;

    const getVideoPoster = (src) => src.replace(/\.(mp4|webm|ogg)$/i, '.jpg');
    const getVideoPlaceholder = () => {
      // Simple dark tile with a play icon, scales to container
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
        <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
          <rect width="120" height="120" rx="10" ry="10" fill="#1f1f1f"/>
          <circle cx="60" cy="60" r="26" fill="#2a2a2a"/>
          <polygon points="52,44 52,76 80,60" fill="#ffffff"/>
        </svg>`;
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    };
    const buildThumbs = (items) => {
      thumbs.innerHTML = '';
      items.forEach((src, idx) => {
        const isVideo = /\.(mp4|webm|ogg)$/i.test(src);
        const t = document.createElement('div');
        t.className = 'thumb' + (isVideo ? ' video' : '');
        const img = document.createElement('img');
        if (isVideo) {
          const poster = getVideoPoster(src);
          img.src = poster;
          img.onerror = () => { img.onerror = null; img.src = getVideoPlaceholder(); };
        } else {
          img.src = src;
        }
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = `media ${idx+1}`;
        t.appendChild(img);
        t.addEventListener('click', () => { currentIndex = idx; renderCurrent(); });
        thumbs.appendChild(t);
      });
    };

    const updateThumbActive = () => {
      const els = thumbs.querySelectorAll('.thumb');
      els.forEach((el, i) => el.classList.toggle('active', i === currentIndex));
    };

    const scrollThumbIntoView = () => {
      const el = thumbs.children[currentIndex];
      if (el && el.scrollIntoView) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    };

    const renderCurrent = () => {
      const item = currentGallery[currentIndex];
      const isVideo = /\.(mp4|webm|ogg)$/i.test(item);
      if (isVideo) {
        lightboxImage.style.display = 'none';
        lightboxVideo.style.display = 'block';
        lightboxVideo.src = item;
        lightboxVideo.play().catch(() => { });
      } else {
        lightboxVideo.pause();
        lightboxVideo.style.display = 'none';
        lightboxImage.style.display = 'block';
        lightboxImage.src = item;
      }
      updateThumbActive();
      scrollThumbIntoView();
    };

    const openLightbox = (indexOrSrc) => {
      currentIndex = typeof indexOrSrc === 'number' ? indexOrSrc : Math.max(0, currentGallery.indexOf(indexOrSrc));
      renderCurrent();
      lightbox.style.display = 'flex';
      document.body.classList.add('no-scroll');
    };
    const closeLightbox = () => {
      // Stop any playing video when closing
      try { lightboxVideo.pause(); } catch {}
      lightboxVideo.removeAttribute('src');
      lightboxVideo.load?.();
      lightbox.style.display = 'none';
      document.body.classList.remove('no-scroll');
    };
    const showNextImage = () => { currentIndex = (currentIndex + 1) % currentGallery.length; renderCurrent(); };
    const showPrevImage = () => { currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length; renderCurrent(); };

    nextArrow.addEventListener('click', showNextImage);
    prevArrow.addEventListener('click', showPrevImage);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox || e.target === lightboxImage) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
      if (lightbox.style.display === 'flex') {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNextImage();
        if (e.key === 'ArrowLeft') showPrevImage();
      }
    });
    let touchStartX = null;
    lightbox.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) { if (dx < 0) showNextImage(); else showPrevImage(); }
      touchStartX = null;
    });

    // Per-gallery setup
    galleries.forEach((gallery) => {
      if (isIndex) return;
      const gameSection = gallery.closest('.game');
      let folder = gameSection?.dataset.folder;
      let gameKey = gallery.dataset.game;
      if (!folder && gameKey) {
        folder = `assets/images/galleries/${gameKey}`;
        if (gameSection) gameSection.dataset.folder = folder;
      }

      let imgs = Array.from(gallery.querySelectorAll('img')).map(i => i.getAttribute('src'));

      const probeAndGet = (candidates) => new Promise((resolve) => {
        const loaded = [];
        let pending = candidates.length;
        if (pending === 0) return resolve(loaded);
        candidates.forEach(src => {
          const img = new Image();
          img.onload = () => { loaded.push(src); if (--pending === 0) resolve(loaded); };
          img.onerror = () => { if (--pending === 0) resolve(loaded); };
          img.src = src;
        });
      });

      const finalize = async (loaded) => {
        if (loaded && loaded.length > 0) {
          imgs = loaded; renderPreview(gallery, imgs); wireClicks(gallery, imgs);
        } else if (gameKey) {
          const rootCandidates = [];
          for (let i = 1; i <= 12; i++) {
            rootCandidates.push(`assets/images/${gameKey}-${i}.jpg`);
            rootCandidates.push(`assets/images/${gameKey}-${i}.png`);
            rootCandidates.push(`assets/images/${gameKey}-${i}.webp`);
          }
          const rootLoaded = await probeAndGet(isMobileLike() ? rootCandidates.slice(0, 9) : rootCandidates);
          if (rootLoaded.length) { imgs = rootLoaded; renderPreview(gallery, imgs); wireClicks(gallery, imgs); }
          else { renderPreview(gallery, imgs); wireClicks(gallery, imgs); }
        } else {
          renderPreview(gallery, imgs); wireClicks(gallery, imgs);
        }
      };

      const loadFromManifest = async () => {
        if (!folder) return null;
        try {
          const res = await fetch(`${folder}/images.json`, { cache: 'no-cache' });
          if (!res.ok) return null;
          const data = await res.json();
          let list = null;
          if (Array.isArray(data)) list = data;
          else if (typeof data === 'string') list = [data];
          else if (data && (Array.isArray(data.images) || Array.isArray(data.files))) list = Array.isArray(data.images) ? data.images : data.files;
          if (!list) return null;
          const exts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.ogg'];
          const files = list.filter(name => typeof name === 'string' && exts.some(ext => name.toLowerCase().endsWith(ext)))
            .map(name => `${folder}/${name}`);
          return files.length ? files : null;
        } catch { return null; }
      };

      const loadFromDirListing = async () => {
        if (!folder) return null;
        try {
          const ensureSlash = (p) => p.endsWith('/') ? p : (p + '/');
          const url = ensureSlash(folder);
          const res = await fetch(url, { cache: 'no-cache' });
          if (!res.ok) return null;
          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('text/html')) return null;
          const html = await res.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const anchors = Array.from(doc.querySelectorAll('a'));
          const exts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm', '.ogg'];
          const items = anchors
            .map(a => a.getAttribute('href') || '')
            .filter(href => href && !href.endsWith('/') && exts.some(ext => href.toLowerCase().endsWith(ext)))
            .map(href => href.startsWith('http') ? href : (url + href.replace(/^\.\//, '')));
          return items.length ? items : null;
        } catch { return null; }
      };

      const findFolderImages = async (folderPath, key) => {
        const exts = ['.png', '.webp', '.jpg', '.jpeg', '.gif', '.mp4', '.webm', '.ogg'];
        const max = isMobileLike() ? 10 : 30;
        const loaded = [];
        let misses = 0;
        const loadProbe = (src) => new Promise((resolve) => { const test = new Image(); test.onload = () => resolve(src); test.onerror = () => resolve(null); test.src = src; });
        for (let i = 1; i <= max; i++) {
          let found = null;
          for (const ext of exts) { const res = await loadProbe(`${folderPath}/${i}${ext}`); if (res) { found = res; break; } }
          if (!found && key) { for (const ext of exts) { const res = await loadProbe(`${folderPath}/${key}-${i}${ext}`); if (res) { found = res; break; } } }
          if (found) { loaded.push(found); misses = 0; } else { misses++; }
          if ((!found && loaded.length >= 3 && i > 6) || (isMobileLike() && loaded.length === 0 && misses >= 5)) break;
        }
        return loaded;
      };

      let loading = false;
      const init = async () => {
        if (loading) return; loading = true;
        if (imgs.length > 0) { renderPreview(gallery, imgs); wireClicks(gallery, imgs); loading = false; return; }
        renderPreview(gallery, []);
        const manifestImgs = await loadFromManifest();
        if (manifestImgs && manifestImgs.length) { imgs = manifestImgs; renderPreview(gallery, imgs); wireClicks(gallery, imgs); loading = false; return; }
        const listed = await loadFromDirListing();
        if (listed && listed.length) { imgs = listed; renderPreview(gallery, imgs); wireClicks(gallery, imgs); loading = false; return; }
        if (folder) {
          const folderImgs = await findFolderImages(folder, gameKey);
          if (folderImgs && folderImgs.length) { imgs = folderImgs; renderPreview(gallery, imgs); wireClicks(gallery, imgs); loading = false; return; }
        } else if (gameKey) {
          const rootCandidates = [];
          for (let i = 1; i <= 12; i++) { rootCandidates.push(`assets/images/${gameKey}-${i}.jpg`, `assets/images/${gameKey}-${i}.png`, `assets/images/${gameKey}-${i}.webp`); }
          const rootLoaded = await probeAndGet(rootCandidates);
          await finalize(rootLoaded); loading = false; return;
        }
        renderPreview(gallery, imgs); wireClicks(gallery, imgs); loading = false;
      };

      const observer = new MutationObserver(() => {
        const newKey = gallery.dataset.game;
        const newFolder = gameSection?.dataset.folder;
        let changed = false;
        if (newKey && newKey !== gameKey) { gameKey = newKey; changed = true; }
        if (newFolder && newFolder !== folder) { folder = newFolder; changed = true; }
        if (changed && (!imgs || imgs.length === 0)) {
          if (!folder && gameKey) { folder = `assets/images/galleries/${gameKey}`; if (gameSection) gameSection.dataset.folder = folder; }
          init();
        }
      });
      if (gameSection) observer.observe(gameSection, { attributes: true, attributeFilter: ['data-folder'] });
      observer.observe(gallery, { attributes: true, attributeFilter: ['data-game'] });

      // Begin discovery
      init();

      // Event delegation remains as a fallback; explicit img clicks are also bound in renderPreview
      gallery.addEventListener('click', async (e) => {
        const target = e.target;
        const el = target && target.nodeType === 1 ? target : (target && target.parentElement ? target.parentElement : null);
        if (!el) return;
        const moreEl = el.closest('.thumb-more');
        if (moreEl) {
          e.preventDefault();
          if (!imgs || imgs.length === 0) await init();
          if (!imgs || imgs.length === 0) return;
          currentGallery = imgs.slice();
          buildThumbs(currentGallery);
          openLightbox(0);
          return;
        }
      }, { capture: true });

  // Block any wheel/touch scroll when hovering over the gallery area
  const blockScroll = (e) => { e.preventDefault(); e.stopPropagation(); };
  gallery.addEventListener('wheel', blockScroll, { passive: false });
  gallery.addEventListener('touchmove', blockScroll, { passive: false });
    });

    function renderPreview(gallery, imgs) {
      gallery.innerHTML = '';
      if (!imgs || imgs.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'gallery-empty';
        empty.textContent = 'No images added yet';
        gallery.appendChild(empty);
        return;
      }
      const baseThumb = 120, gap = 10;
      const containerWidth = gallery.clientWidth || gallery.parentElement.clientWidth || 0;
      let showCount;
      if (containerWidth > 0) {
        const maxThumbs = Math.max(1, Math.floor((containerWidth + gap) / (baseThumb + gap)));
        showCount = Math.min(maxThumbs, imgs.length);
        const totalGaps = (showCount - 1) * gap;
        const thumbSize = Math.floor((containerWidth - totalGaps) / showCount);
        gallery.style.setProperty('--thumb-size', `${thumbSize}px`);
      } else {
        showCount = Math.min(3, imgs.length);
        gallery.style.removeProperty('--thumb-size');
      }
    const overflow = imgs.length - showCount;
      for (let i = 0; i < showCount; i++) {
        if (i === showCount - 1 && overflow > 0) {
          const more = document.createElement('div');
          more.className = 'thumb-more';
      // Hidden images = total - actually rendered images (showCount - 1)
      const hiddenCount = imgs.length - (showCount - 1);
      more.textContent = `+${hiddenCount}`;
          more.title = `View all ${imgs.length} images`;
          more.addEventListener('click', () => { currentGallery = imgs.slice(); currentIndex = 0; openLightbox(currentGallery[currentIndex]); });
          gallery.appendChild(more);
        } else {
          const src = imgs[i];
          const img = document.createElement('img');
          const isVideo = /\.(mp4|webm|ogg)$/i.test(src);
          if (isVideo) {
            const poster = getVideoPoster(src);
            img.src = poster;
            img.onerror = () => { img.onerror = null; img.src = getVideoPlaceholder(); };
          } else {
            img.src = src;
          }
          img.loading = 'lazy';
          img.decoding = 'async';
          img.alt = gallery.dataset.game ? `${gallery.dataset.game} screenshot ${i + 1}` : `screenshot ${i + 1}`;
          img.addEventListener('click', (e) => { e.preventDefault(); currentGallery = imgs.slice(); buildThumbs(currentGallery); openLightbox(i); });
          gallery.appendChild(img);
        }
      }
    }

    function wireClicks(gallery, imgs) {
      const onResize = () => renderPreview(gallery, imgs);
      window.addEventListener('resize', onResize);
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();