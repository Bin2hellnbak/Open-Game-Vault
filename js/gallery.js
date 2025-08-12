document.addEventListener("DOMContentLoaded", () => {
    const galleries = document.querySelectorAll(".gallery");
    const isIndex = document.documentElement.getAttribute('data-page') === 'index';

    // Create lightbox UI once
    const lightbox = document.createElement("div");
    lightbox.classList.add("lightbox");
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    document.body.appendChild(lightbox);

    const lightboxImage = document.createElement("img");
    const lightboxVideo = document.createElement("video");
    lightboxVideo.controls = true;
    lightboxVideo.style.maxWidth = '90%';
    lightboxVideo.style.maxHeight = '80%';
    lightbox.appendChild(lightboxImage);
    lightbox.appendChild(lightboxVideo);

    const controls = document.createElement("div");
    controls.classList.add("controls");
    lightbox.appendChild(controls);

    const prevArrow = document.createElement("span");
    prevArrow.classList.add("arrow");
    prevArrow.textContent = "❮";
    controls.appendChild(prevArrow);

    const nextArrow = document.createElement("span");
    nextArrow.classList.add("arrow");
    nextArrow.textContent = "❯";
    controls.appendChild(nextArrow);

    let currentGallery = [];
    let currentIndex = 0;

    const renderCurrent = () => {
        const item = currentGallery[currentIndex];
        const isVideo = /\.(mp4|webm|ogg)$/i.test(item);
        if (isVideo) {
            lightboxImage.style.display = 'none';
            lightboxVideo.style.display = 'block';
            lightboxVideo.src = item;
            lightboxVideo.play().catch(()=>{});
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
        if (typeof indexOrSrc === 'number') {
            currentIndex = indexOrSrc;
        } else {
            currentIndex = Math.max(0, currentGallery.indexOf(indexOrSrc));
        }
        renderCurrent();
        lightbox.style.display = "flex";
        document.body.classList.add("no-scroll");
    };

    const closeLightbox = () => {
        lightbox.style.display = "none";
        document.body.classList.remove("no-scroll");
    };

    const showNextImage = () => {
        currentIndex = (currentIndex + 1) % currentGallery.length;
        renderCurrent();
    };

    const showPrevImage = () => {
        currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
        renderCurrent();
    };

    nextArrow.addEventListener("click", showNextImage);
    prevArrow.addEventListener("click", showPrevImage);
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox || e.target === lightboxImage) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
        if (lightbox.style.display === "flex") {
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowRight") showNextImage();
            if (e.key === "ArrowLeft") showPrevImage();
        }
    });

    // Touch swipe support
    let touchStartX = null;
    lightbox.addEventListener("touchstart", (e) => {
        touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    lightbox.addEventListener("touchend", (e) => {
        if (touchStartX === null) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(deltaX) > 40) {
            if (deltaX < 0) showNextImage();
            else showPrevImage();
        }
        touchStartX = null;
    });

    // Helper: guess typical media file names within a game folder
    const possibleNames = [
        "1.jpg","1.png","1.webp",
        "2.jpg","2.png","2.webp",
        "3.jpg","3.png","3.webp",
        "4.jpg","4.png","4.webp",
        "5.jpg","5.png","5.webp",
        "6.jpg","6.png","6.webp",
        "7.jpg","7.png","7.webp",
        "8.jpg","8.png","8.webp",
        "9.jpg","9.png","9.webp",
    "10.jpg","10.png","10.webp",
    // videos
    "1.mp4","2.mp4","3.mp4",
    "1.webm","2.webm","3.webm",
    "1.ogg","2.ogg","3.ogg"
    ];

    // Note: without a backend or directory listing, we can't read folders.
    // We'll render from any existing <img> children; if none, try common names.
    galleries.forEach(gallery => {
        if (isIndex) return; // skip inline gallery building on index page
        const gameSection = gallery.closest('.game');
    const folder = gameSection?.dataset.folder; // e.g., assets/images/space-explorer
        const gameKey = gallery.dataset.game; // e.g., space-explorer

        // Collect images: start from any pre-existing imgs in DOM
        let imgs = Array.from(gallery.querySelectorAll('img')).map(i => i.getAttribute('src'));

        const probeAndGet = (candidates) => {
            return new Promise((resolve) => {
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
        };

        const finalize = async (loaded) => {
            if (loaded && loaded.length > 0) {
                imgs = loaded;
                renderPreview(gallery, imgs);
                wireClicks(gallery, imgs);
            } else if (gameKey) {
                // Fallback: root images using pattern like assets/images/space-explorer-1.jpg/png/webp
                const rootCandidates = [];
                for (let i = 1; i <= 12; i++) {
                    rootCandidates.push(`assets/images/${gameKey}-${i}.jpg`);
                    rootCandidates.push(`assets/images/${gameKey}-${i}.png`);
                    rootCandidates.push(`assets/images/${gameKey}-${i}.webp`);
                }
                const rootLoaded = await probeAndGet(rootCandidates);
                if (rootLoaded.length) {
                    imgs = rootLoaded;
                    renderPreview(gallery, imgs);
                    wireClicks(gallery, imgs);
                } else {
                    renderPreview(gallery, imgs);
                    wireClicks(gallery, imgs);
                }
            } else {
                renderPreview(gallery, imgs);
                wireClicks(gallery, imgs);
            }
        };

        const loadFromManifest = async () => {
            if (!folder) return null;
            try {
                const res = await fetch(`${folder}/images.json`, { cache: 'no-cache' });
                if (!res.ok) return null;
                const data = await res.json();
                // Accept array of strings or { images: [] }
                const list = Array.isArray(data) ? data : (Array.isArray(data?.images) ? data.images : null);
                if (!list) return null;
                // Filter to image-like files and prefix folder
                const exts = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
                const files = list
                    .filter(name => typeof name === 'string' && exts.some(ext => name.toLowerCase().endsWith(ext)))
                    .map(name => `${folder}/${name}`);
                return files.length ? files : null;
            } catch (_) {
                return null;
            }
        };

        // Try to discover images sequentially to avoid waiting for many 404s
        const findFolderImages = async (folderPath, key) => {
            const exts = [".png", ".webp", ".jpg", ".jpeg", ".gif", ".mp4", ".webm", ".ogg"]; // order preference incl. video
            const max = 30; // up to 30 images
            const loaded = [];

            const loadProbe = (src) => new Promise((resolve) => {
                const test = new Image();
                test.onload = () => resolve(src);
                test.onerror = () => resolve(null);
                test.src = src;
            });

            for (let i = 1; i <= max; i++) {
                let found = null;
                // Try plain numeric
                for (const ext of exts) {
                    const res = await loadProbe(`${folderPath}/${i}${ext}`);
                    if (res) { found = res; break; }
                }
                // Try key-prefixed numeric if not found
                if (!found && key) {
                    for (const ext of exts) {
                        const res = await loadProbe(`${folderPath}/${key}-${i}${ext}`);
                        if (res) { found = res; break; }
                    }
                }
                if (found) loaded.push(found);
                // Early stop if we miss several in a row and already have some
                if (!found && loaded.length >= 3 && i > 6) break;
            }
            return loaded;
        };

        const init = async () => {
            if (imgs.length > 0) {
                renderPreview(gallery, imgs);
                wireClicks(gallery, imgs);
                return;
            }

            // Try manifest first
            const manifestImgs = await loadFromManifest();
            if (manifestImgs && manifestImgs.length) {
                imgs = manifestImgs;
                renderPreview(gallery, imgs);
                wireClicks(gallery, imgs);
                return;
            }

            // Fallbacks
            if (folder) {
                const folderImgs = await findFolderImages(folder, gameKey);
                if (folderImgs && folderImgs.length) {
                    imgs = folderImgs;
                    renderPreview(gallery, imgs);
                    wireClicks(gallery, imgs);
                    return;
                }
            } else if (gameKey) {
                const rootCandidates = [];
                for (let i = 1; i <= 12; i++) {
                    rootCandidates.push(`assets/images/${gameKey}-${i}.jpg`);
                    rootCandidates.push(`assets/images/${gameKey}-${i}.png`);
                    rootCandidates.push(`assets/images/${gameKey}-${i}.webp`);
                }
                const rootLoaded = await probeAndGet(rootCandidates);
                await finalize(rootLoaded);
                return;
            }

            // If nothing found so far
            renderPreview(gallery, imgs);
            wireClicks(gallery, imgs);
        };

        // Build/reuse the lightbox thumbs strip once
        let thumbs = lightbox.querySelector('.thumbs');
        if (!thumbs) {
            thumbs = document.createElement('div');
            thumbs.className = 'thumbs';
            lightbox.appendChild(thumbs);
        }

        function buildThumbs(items) {
            thumbs.innerHTML = '';
            items.forEach((src, idx) => {
                const isVideo = /\.(mp4|webm|ogg)$/i.test(src);
                const t = document.createElement('div');
                t.className = 'thumb' + (isVideo ? ' video' : '');
                const img = document.createElement('img');
                img.src = isVideo ? getVideoPoster(src) : src;
                img.alt = `media ${idx+1}`;
                t.appendChild(img);
                t.addEventListener('click', () => {
                    currentIndex = idx;
                    renderCurrent();
                });
                thumbs.appendChild(t);
            });
        }

        function updateThumbActive() {
            const els = thumbs.querySelectorAll('.thumb');
            els.forEach((el, i) => {
                if (i === currentIndex) el.classList.add('active');
                else el.classList.remove('active');
            });
        }

        function scrollThumbIntoView() {
            const el = thumbs.children[currentIndex];
            if (el && typeof el.scrollIntoView === 'function') {
                el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
            }
        }

        function getVideoPoster(src) {
            // Basic poster heuristic: replace extension with .jpg; if not available, uses video as-is
            return src.replace(/\.(mp4|webm|ogg)$/i, '.jpg');
        }

        init();

        // After images are resolved, wire thumbs and open behavior from previews
        const openFullFromPreview = (clickedIndex) => {
            currentGallery = imgs.slice();
            buildThumbs(currentGallery);
            openLightbox(clickedIndex);
        };

        // Replace previous click handler with one that opens the full set
        gallery.addEventListener('click', async (e) => {
            const target = e.target;
            const el = target && target.nodeType === 1 ? target : (target && target.parentElement ? target.parentElement : null);
            if (!el) return;

            const moreEl = el.closest('.thumb-more');
            if (moreEl) {
                e.preventDefault();
                if (!imgs || imgs.length === 0) await init();
                if (!imgs || imgs.length === 0) return;
                openFullFromPreview(0);
                return;
            }

            const imgEl = el.closest('img');
            if (imgEl && gallery.contains(imgEl)) {
                e.preventDefault();
                const imgsInDom = Array.from(gallery.querySelectorAll('img'));
                const idx = imgsInDom.indexOf(imgEl);
                if (idx >= 0) {
                    if (!imgs || imgs.length === 0) await init();
                    if (!imgs || imgs.length === 0) return;
                    openFullFromPreview(idx);
                }
            }
        }, { capture: true });
    });

    function renderPreview(gallery, imgs) {
        gallery.innerHTML = "";
        if (!imgs || imgs.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'gallery-empty';
            empty.textContent = 'No images added yet';
            gallery.appendChild(empty);
            return;
        }

        // Compute how many thumbnails fit in gallery width and set exact size to avoid right gap
        const baseThumb = 120; // reference size for estimating count
        const gap = 10;        // must match CSS .gallery gap

        const containerWidth = gallery.clientWidth || gallery.parentElement.clientWidth || 0;
        // If width is not measurable yet (e.g., not laid out), show a small default and retry on resize
        let showCount;
        if (containerWidth > 0) {
            const maxThumbs = Math.max(1, Math.floor((containerWidth + gap) / (baseThumb + gap)));
            showCount = Math.min(maxThumbs, imgs.length);
            // Exact size so: showCount * size + (showCount - 1) * gap = containerWidth
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
                // Render '+N more' tile
                const more = document.createElement('div');
                more.className = 'thumb-more';
                more.textContent = `+${overflow}`;
                more.title = `View all ${imgs.length} images`;
                more.addEventListener('click', () => {
                    currentGallery = imgs.slice();
                    currentIndex = 0;
                    openLightbox(currentGallery[currentIndex]);
                });
                gallery.appendChild(more);
            } else {
                const src = imgs[i];
                const img = document.createElement('img');
                img.src = src;
                img.loading = 'lazy';
                img.decoding = 'async';
                img.alt = gallery.dataset.game ? `${gallery.dataset.game} screenshot ${i+1}` : `screenshot ${i+1}`;
                gallery.appendChild(img);
            }
        }
    }

    function wireClicks(gallery, imgs) {
        // Re-render on resize to recalc how many thumbs fit
        const onResize = () => renderPreview(gallery, imgs);
        window.addEventListener('resize', onResize);
    }
});