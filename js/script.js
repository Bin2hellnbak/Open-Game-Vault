// Background music rotation for index page
document.addEventListener('DOMContentLoaded', () => {
	// Only run on main page (we tagged index by setting data-page in index.html before other scripts)
	const isIndex = document.documentElement.getAttribute('data-page') === 'index';

	// If we land on the index with a per-game track still playing (from history), switch back to general
	try {
		if (isIndex) {
			// Will be corrected again after audio init if needed
			const GENERAL_BASE = 'assets/general/audio/music/background/';
			const isFromGeneral = (url) => !!(url && url.indexOf(GENERAL_BASE) === 0);
			// We don't have the audio element yet here; the later pageshow hook also handles it.
		}
	} catch {}

	// Build starfield background (run on all pages)
	(function initStarfield(){
		const sf = document.createElement('div');
		sf.className = 'starfield';
		document.body.appendChild(sf);
		const isMobile = matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth <= 600;
		const prefersReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReduce) { try { document.body.classList.add('reduced-motion'); } catch {}
		}
		// Heuristic device memory (Chromium only); treat <=4GB as lower capability
		let lowMem = false;
		try { if (navigator.deviceMemory && navigator.deviceMemory <= 4) lowMem = true; } catch {}
		// Base star count decisions
		let count = 140;
		if (isMobile) count = 50;            // lower baseline for mobile
		if (lowMem) count = Math.min(count, 48);
		if (prefersReduce) count = Math.min(count, 36);
		// Add a few faint spiral galaxies on desktop only
		if (!isMobile && !lowMem && !prefersReduce) {
			const galaxyCount = 2 + Math.floor(Math.random() * 2); // 2-3 galaxies
			for (let g = 0; g < galaxyCount; g++) {
				const gal = document.createElement('div');
				gal.className = 'galaxy';
				// random size and position
				const size = 44 + Math.random() * 28; // vmin
				const left = Math.random() * 100; // vw
				const top = Math.random() * 100;  // vh
				gal.style.width = size + 'vmin';
				gal.style.height = size + 'vmin';
				gal.style.left = left + 'vw';
				gal.style.top = top + 'vh';
				gal.style.transform = `translate(-50%, -50%) rotate(${(Math.random()*60-30).toFixed(1)}deg)`;
				// choose a cool or warm palette
				const cool = Math.random() < 0.55;
				const c1 = cool ? 'rgba(150,190,255,0.18)' : 'rgba(255,190,190,0.18)'; // core tint
				const armA1 = cool ? 'rgba(150,210,255,0.18)' : 'rgba(255,160,170,0.18)';
				const armA0 = cool ? 'rgba(150,210,255,0.00)' : 'rgba(255,160,170,0.00)';
				const armB1 = cool ? 'rgba(210,200,255,0.16)' : 'rgba(255,200,170,0.16)';
				const armB0 = cool ? 'rgba(210,200,255,0.00)' : 'rgba(255,200,170,0.00)';
				// build background with radial core + two conic arms layers
				gal.style.background = [
					`radial-gradient(circle at 50% 50%, ${c1} 0%, rgba(255,255,255,0.00) 62%)`,
					`conic-gradient(from ${(-25 + Math.random()*50).toFixed(0)}deg at 50% 50%,
						${armA0} 0deg,
						${armA1} 12deg,
						${armA0} 28deg,
						${armA1} 64deg,
						${armA0} 86deg,
						${armA1} 128deg,
						${armA0} 148deg,
						${armA1} 196deg,
						${armA0} 216deg,
						${armA1} 268deg,
						${armA0} 288deg,
						transparent 360deg
					)`,
					`conic-gradient(from ${( -10 + Math.random()*20).toFixed(0)}deg at 50% 50%,
						${armB0} 0deg,
						${armB1} 10deg,
						${armB0} 28deg,
						${armB1} 60deg,
						${armB0} 82deg,
						${armB1} 120deg,
						${armB0} 142deg,
						${armB1} 190deg,
						${armB0} 210deg,
						${armB1} 260deg,
						${armB0} 282deg,
						transparent 360deg
					)`
				].join(',');
				sf.appendChild(gal);
			}
		}
		for (let i = 0; i < count; i++) {
			const s = document.createElement('div');
			s.className = 'star';
			if (Math.random() < 0.12) s.classList.add('big');
			if (Math.random() < 0.25) s.classList.add('dim');
			const left = Math.random() * 100;
			const top = Math.random() * 100;
			s.style.left = left + 'vw';
			s.style.top = top + 'vh';
			s.style.setProperty('--twinkle-dur', (3 + Math.random() * 4).toFixed(2) + 's');
			sf.appendChild(s);
		}
		// Shooting stars (skip entirely for mobile / reduced motion / low mem)
		if (!isMobile && !prefersReduce && !lowMem) {
			function shoot() {
				const sh = document.createElement('div');
				sh.className = 'shooting-star';
				const edge = Math.floor(Math.random() * 4);
				let angleDeg = 0;
				if (edge === 0) { sh.style.left = (-20 - Math.random()*20) + 'vw'; sh.style.top = (Math.random()*100) + 'vh'; angleDeg = (Math.random()*90)-45; }
				else if (edge === 1) { sh.style.left = (120 + Math.random()*20) + 'vw'; sh.style.top = (Math.random()*100) + 'vh'; angleDeg = 180 + (Math.random()*90 -45); }
				else if (edge === 2) { sh.style.left = (Math.random()*100) + 'vw'; sh.style.top = (-20 - Math.random()*20) + 'vh'; angleDeg = 90 + (Math.random()*90 -45); }
				else { sh.style.left = (Math.random()*100) + 'vw'; sh.style.top = (120 + Math.random()*20) + 'vh'; angleDeg = -90 + (Math.random()*90 -45); }
				sh.style.setProperty('--angle', angleDeg + 'deg');
				const dur = (2.4 + Math.random() * 1.8).toFixed(2); // slightly shorter range
				sh.style.setProperty('--shoot-dur', dur + 's');
				sf.appendChild(sh);
				setTimeout(() => sh.remove(), (parseFloat(dur) * 1000) + 400);
				setTimeout(shoot, 8000 + Math.random() * 8000); // fewer occurrences
			}
			setTimeout(shoot, 4000 + Math.random() * 6000);
		}

		// If no backdrop-filter support, insert a blurred proxy star layer inside the header
		try {
			const supportsBF = CSS && (CSS.supports('backdrop-filter: blur(1px)') || CSS.supports('-webkit-backdrop-filter: blur(1px)'));
			if (!supportsBF && !isMobile) { // skip proxies on mobile for performance
				const header = document.querySelector('header');
				if (header) {
					const proxy = document.createElement('div');
					proxy.className = 'header-blur-proxy';
					header.insertBefore(proxy, header.firstChild);
					for (let i = 0; i < 80; i++) {
						const st = document.createElement('div');
						st.className = 'star';
						if (Math.random() < 0.12) st.classList.add('big');
						if (Math.random() < 0.25) st.classList.add('dim');
						st.style.left = Math.random() * 100 + '%';
						st.style.top = Math.random() * 100 + '%';
						st.style.setProperty('--twinkle-dur', (3 + Math.random() * 4).toFixed(2) + 's');
						proxy.appendChild(st);
					}
				}

				// Also add proxies inside each .game card
				const cards = document.querySelectorAll('.game');
				cards.forEach(card => {
					// Skip if there's already a proxy
					if (card.querySelector('.glass-blur-proxy')) return;
					const proxy = document.createElement('div');
					proxy.className = 'glass-blur-proxy';
					card.insertBefore(proxy, card.firstChild);
					for (let i = 0; i < 36; i++) {
						const st = document.createElement('div');
						st.className = 'star';
						if (Math.random() < 0.12) st.classList.add('big');
						if (Math.random() < 0.25) st.classList.add('dim');
						st.style.left = Math.random() * 100 + '%';
						st.style.top = Math.random() * 100 + '%';
						st.style.setProperty('--twinkle-dur', (3 + Math.random() * 4).toFixed(2) + 's');
						proxy.appendChild(st);
					}
				});
			}
		} catch {}
	})();

	// Mark covers with missing or broken images so a placeholder message shows
	(function initCoverPlaceholders(){
		// Skip on index; the cover area will host an inline gallery viewer instead
		const isIndexHere = document.documentElement.getAttribute('data-page') === 'index';
		if (isIndexHere) return;
		const covers = document.querySelectorAll('.cover');
		covers.forEach(cov => {
			const img = cov.querySelector('img');
			const tryDerived = () => {
				const section = cov.closest('.game');
				const slug = section?.id || cov.getAttribute('data-game');
				if (!slug || !img) return false;
				const candidates = [
					`assets/games/logos/${slug}/logo.webp`,
					`assets/games/logos/${slug}/logo.png`,
					`assets/games/logos/${slug}/logo.jpg`,
					`assets/games/logos/${slug}/logo.jpeg`
				];
				let idx = 0;
				const next = () => {
					if (idx >= candidates.length) { markEmpty(); return; }
					const url = candidates[idx++];
					const probe = new Image();
					probe.onload = () => { img.style.display = ''; img.src = url; cov.classList.remove('empty'); };
					probe.onerror = () => next();
					probe.src = url;
				};
				next();
				return true;
			};
			const markEmpty = () => {
				cov.classList.add('empty');
				if (img) img.style.display = 'none';
			};
			if (!img) { markEmpty(); return; }
			if (!img.getAttribute('src')) { if (!tryDerived()) markEmpty(); return; }
			if (img.complete && img.naturalWidth === 0) { if (!tryDerived()) markEmpty(); return; }
			img.addEventListener('error', () => { if (!tryDerived()) markEmpty(); }, { once: true });
		});
	})();

	// Index-specific rendering below is gated; other features (e.g., music) run on all pages

	// Sync index card titles from the manifest so renames in games.json reflect on the main page
	if (isIndex) (async function renderIndexFromManifest(){
		const container = document.getElementById('games-container');
		if (!container) return;
		container.innerHTML = '';
		let manifest = null;
		try {
			const res = await fetch('assets/data/games.json', { cache: 'no-cache' });
			if (!res.ok) throw new Error('manifest fetch failed');
			manifest = await res.json();
			if (!manifest || typeof manifest !== 'object') throw new Error('manifest not object');
		} catch (e) {
			const p = document.createElement('p');
			p.textContent = 'No games available. Check assets/data/games.json.';
			container.appendChild(p);
			return;
		}
		const entries = Object.entries(manifest);
		if (!entries.length) {
			const p = document.createElement('p');
			p.textContent = 'No games available. Add entries to assets/data/games.json.';
			container.appendChild(p);
			return;
		}
		for (const [slug, entry] of entries) {
			const name = entry?.name || slug;
			const tags = Array.isArray(entry?.tags) ? entry.tags : [];
			const sec = document.createElement('section');
			sec.className = 'game';
			sec.id = slug;
			sec.dataset.title = name;
			if (tags.length) sec.dataset.tags = tags.join(',');
			sec.dataset.folder = `assets/games/galleries/${slug}`;
			sec.innerHTML = `
				<div class="game-header">
					<h2 class="title"><a class="title-link" href="game.html?g=${slug}"><span class="game-title-text">${name}</span></a></h2>
					<a class="btn view-btn" href="game.html?g=${slug}">View</a>
				</div>
				<div class="cover" data-game="${slug}"></div>
				${tags.length ? `<div class="tags" aria-label="Tags">${tags.map(t => `<span class=\"tag\">${t}</span>`).join('')}</div>` : ''}`;
			container.appendChild(sec);
			// Try to replace text title with logo image if it exists
			try {
				const titleLink = sec.querySelector('.game-header .title-link');
				const textSpan = sec.querySelector('.game-header .game-title-text');
				const candidates = [
					`assets/games/logos/${slug}/logo.webp`,
					`assets/games/logos/${slug}/logo.png`,
					`assets/games/logos/${slug}/logo.jpg`,
					`assets/games/logos/${slug}/logo.jpeg`
				];
				let i = 0;
				const tryNext = () => {
					if (i >= candidates.length) return;
					const test = new Image();
					test.onload = () => {
						const img = document.createElement('img');
						img.className = 'game-logo';
						img.alt = `${name} logo`;
						img.src = candidates[i];
						if (titleLink) {
							titleLink.insertBefore(img, textSpan || null);
							if (textSpan) textSpan.style.display = 'none';
						}
					};
					test.onerror = () => { i++; tryNext(); };
					test.src = candidates[i];
				};
				tryNext();
			} catch {}
		}
		// After cards are rendered, build inline gallery viewers into each cover
		initInlineCoverViewers();
		setupCoverVisibilityObserver();
		// Notify listeners (e.g., search) that games have been rendered
		try { window.dispatchEvent(new Event('gamesRendered')); } catch {}
	})();

	async function initInlineCoverViewers() {
		const covers = document.querySelectorAll('#games-container .cover');
		for (const cov of covers) {
			const card = cov.closest('.game');
			const slug = card?.id || cov.getAttribute('data-game');
			const folder = card?.dataset.folder || (slug ? `assets/games/galleries/${slug}` : null);
			cov.innerHTML = '';
			cov.classList.remove('empty');
			const mediaWrap = document.createElement('div');
			mediaWrap.className = 'inline-media';
			cov.appendChild(mediaWrap);
			const prevBtn = document.createElement('button');
			prevBtn.className = 'nav prev';
			prevBtn.type = 'button';
			prevBtn.setAttribute('aria-label','Previous');
			prevBtn.textContent = '❮';
			const nextBtn = document.createElement('button');
			nextBtn.className = 'nav next';
			nextBtn.type = 'button';
			nextBtn.setAttribute('aria-label','Next');
			nextBtn.textContent = '❯';
			cov.appendChild(prevBtn);
			cov.appendChild(nextBtn);

			// (Removed custom fullscreen button)

			// Progress bar UI
			const prog = document.createElement('div');
			prog.className = 'progress hidden';
			const bar = document.createElement('div');
			bar.className = 'bar';
			prog.appendChild(bar);
			cov.appendChild(prog);

			let items = [];
			const exts = ['.jpg','.jpeg','.png','.webp','.gif','.mp4','.webm','.ogg'];
			if (folder) {
				try {
					const res = await fetch(`${folder}/images.json`, { cache: 'no-cache' });
					if (res.ok) {
						const data = await res.json();
						let list = null;
						if (Array.isArray(data)) list = data;
						else if (typeof data === 'string') list = [data];
						else if (data && (Array.isArray(data.images) || Array.isArray(data.files))) list = Array.isArray(data.images) ? data.images : data.files;
						if (list) items = list.filter(n => typeof n === 'string' && exts.some(ext => n.toLowerCase().endsWith(ext))).map(n => `${folder}/${n}`);
					}
				} catch {}
			}

			if (!items.length) {
				// Graceful empty state
				const empty = document.createElement('div');
				empty.className = 'gallery-empty';
				empty.textContent = 'No media added yet';
				mediaWrap.appendChild(empty);
				prevBtn.style.display = 'none';
				nextBtn.style.display = 'none';
				continue;
			}

			let idx = 0;
		    function render() {
				mediaWrap.innerHTML = '';
				const src = items[idx];
				const isVideo = /\.(mp4|webm|ogg)$/i.test(src);
				if (isVideo) {
					const v = document.createElement('video');
					v.controls = false; // hidden by default; we show on hover/touch
					v.playsInline = true;
					v.setAttribute('playsinline','');
					v.setAttribute('webkit-playsinline','');
					v.setAttribute('disablepictureinpicture','');
		    v.muted = true; // autoplay-friendly
		    v.autoplay = true;
					v.src = src;
					mediaWrap.appendChild(v);
		    // Reset/end tracking and try to start playback; muted autoplay should generally succeed
					if (cov._inline) { cov._inline.endedAt = null; cov._inline.lastAdvanceAt = Date.now(); }
					v.addEventListener('ended', () => {
						// mark end and ensure it doesn't auto-restart
						if (cov._inline) cov._inline.endedAt = Date.now();
						v.autoplay = false;
					});
					// Show controls on hover/focus/touch; pin visibility briefly after touch to avoid flicker
					const showControls = () => {
						v.controls = true;
						if (v._controlsHideTimer) { clearTimeout(v._controlsHideTimer); v._controlsHideTimer = null; }
					};
					const scheduleHide = (msDefault = 1000) => {
						const now = Date.now();
						let ms = msDefault;
						const pinnedUntil = v._controlsPinnedUntil || 0;
						if (pinnedUntil > now) {
							ms = Math.max(msDefault, pinnedUntil - now + 50);
						}
						if (v._controlsHideTimer) clearTimeout(v._controlsHideTimer);
						v._controlsHideTimer = setTimeout(() => { v.controls = false; v._controlsHideTimer = null; }, ms);
					};
					v.addEventListener('pointerenter', showControls);
					v.addEventListener('pointerleave', () => scheduleHide(300));
					v.addEventListener('focus', showControls);
					v.addEventListener('blur', () => scheduleHide(200));
					v.addEventListener('touchstart', () => {
						v._controlsPinnedUntil = Date.now() + 2500;
						showControls();
						scheduleHide();
					}, { passive: true });
		    v.play?.().catch(() => {});
				} else {
					const img = document.createElement('img');
					img.src = src;
					img.alt = (card?.dataset.title || slug || 'media');
					mediaWrap.appendChild(img);
	    		if (cov._inline) { cov._inline.endedAt = null; cov._inline.lastAdvanceAt = Date.now(); }
				}
				prevBtn.style.display = items.length > 1 ? '' : 'none';
				nextBtn.style.display = items.length > 1 ? '' : 'none';

				// Reset progress bar at each render
				bar.style.width = '0%';
				// Show bar for images, hide for videos while playing; ended state will reveal via rAF
				if (isVideo) prog.classList.add('hidden'); else prog.classList.remove('hidden');
			}
			const next = () => { idx = (idx + 1) % items.length; render(); };
			const prev = () => { idx = (idx - 1 + items.length) % items.length; render(); };
			function setHold() {
				if (cov._inline) {
					cov._inline.userHoldUntil = Date.now() + 20000; // 20s hold
					cov._inline.endedAt = null; // reset any ended waits
					// Hide and reset progress bar visually during hold
					if (cov._inline._progressWrap) cov._inline._progressWrap.classList.add('hidden');
					if (cov._inline._progressBar) cov._inline._progressBar.style.width = '0%';
				}
			}
			nextBtn.addEventListener('click', () => { next(); setHold(); });
			prevBtn.addEventListener('click', () => { prev(); setHold(); });
			// (Custom fullscreen overlay removed)
			render();

			// Expose inline controller for auto-rotation logic
			cov._inline = {
				el: cov,
				get items() { return items; },
				get index() { return idx; },
				set index(i) { idx = ((i % items.length) + items.length) % items.length; render(); },
				next,
				prev,
				currentIsVideo() { return items.length > 0 && /\.(mp4|webm|ogg)$/i.test(items[idx]); },
				getCurrentVideoEl() { return mediaWrap.querySelector('video'); },
				endedAt: null,
				lastAdvanceAt: Date.now(),
				userHoldUntil: null,
				inView: false,
				pausedByVisibility: false,
				_progressBar: bar,
				_progressWrap: prog
			};
		}
		// Signal that all covers finished initial inline setup
		try { window.dispatchEvent(new Event('coversReady')); } catch {}
	}

	// Pause media and countdown when covers are out of view; resume countdown on re-entry
	let coverIO = null;
	function setupCoverVisibilityObserver(){
		try {
			if (coverIO) { // re-observe for new covers
				const covers = document.querySelectorAll('#games-container .cover');
				covers.forEach(c => coverIO.observe(c));
				return;
			}
			coverIO = new IntersectionObserver((entries) => {
				const now = Date.now();
				entries.forEach(entry => {
					const cov = entry.target;
					const ctl = cov && cov._inline;
					if (!ctl) return;
					ctl.intersectionRatio = entry.intersectionRatio || 0;
					if (entry.isIntersecting) {
						ctl.inView = true;
						// Auto-resume only if we paused due to visibility
						if (ctl.pausedByVisibility) {
							const v = ctl.getCurrentVideoEl();
							if (v && v.paused && !v.ended) { v.play?.().catch(() => {}); }
							ctl.pausedByVisibility = false;
						}
					} else {
						ctl.inView = false;
						const v = ctl.getCurrentVideoEl();
						if (v && !v.paused) {
							v.pause();
							ctl.pausedByVisibility = true;
						}
						// Hide progress bar while offscreen
						if (ctl._progressWrap) { ctl._progressWrap.classList.add('hidden'); }
						if (ctl._progressBar) { ctl._progressBar.style.width = '0%'; }
					}
				});
			}, { root: null, threshold: 0 });
			const covers = document.querySelectorAll('#games-container .cover');
			covers.forEach(c => coverIO.observe(c));
		} catch {}
	}

		function getPageType(){ return document.documentElement.getAttribute('data-page') || ''; }
		function getGameSlug(){
			try { const u = new URL(window.location.href); return u.searchParams.get('g') || null; } catch { return null; }
		}
		function getMusicBases(){
			const page = getPageType();
			if (page === 'game') {
				const slug = getGameSlug();
				if (slug) return [ `assets/games/background-music/${slug}/`, 'assets/general/audio/music/background/' ];
			}
			return [ 'assets/general/audio/music/background/' ];
		}
		const BASES = getMusicBases();
		const GENERAL_BASE = 'assets/general/audio/music/background/';
		const FALLBACK = GENERAL_BASE + 'background-music-1.mp3';
		function startsWithAnyBase(url) {
			try { return !!(url && BASES.some(b => url.indexOf(b) === 0)); } catch { return false; }
		}
		function isFromGeneral(url) { try { return !!(url && url.indexOf(GENERAL_BASE) === 0); } catch { return false; } }
		const exts = ['mp3','ogg','webm','wav','m4a'];
		const names = [];
		// Common patterns
		for (let i = 1; i <= 20; i++) names.push(`background-music-${i}`);
		for (let i = 1; i <= 20; i++) names.push(`track-${i}`);
		for (let i = 1; i <= 20; i++) names.push(`music-${i}`);
		// Also try a few generic bases (and common single-file names)
		names.push('background', 'ambient', 'theme', 'background-music', 'bgm', 'menu', 'main');
		// If on a game page, include slug-based guesses
		try {
			const slugGuess = getGameSlug && getGameSlug();
			if (slugGuess) {
				names.push(slugGuess);
				names.push(`${slugGuess}-theme`, `${slugGuess}-bgm`, `${slugGuess}-music`);
			}
		} catch {}

		async function headExists(url) {
			try {
				let res = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
				if (res.ok) return true;
				// Some static servers don't support HEAD; try a tiny ranged GET
				if (res.status && res.status !== 404) {
					try {
						res = await fetch(url, { method: 'GET', headers: { 'Range': 'bytes=0-0' }, cache: 'no-cache' });
						return res.ok || res.status === 206;
					} catch {}
				}
				return false;
			} catch {
				// Final fallback: normal GET
				try {
					const res = await fetch(url, { method: 'GET', cache: 'no-cache' });
					return res.ok;
				} catch { return false; }
			}
		}

		async function discoverTracks() {
			const candidates = [];
			// Build candidate list across all bases, prefer earlier bases (per-game first)
			for (const base of BASES) {
				candidates.push(base + 'background-music-1.mp3');
				for (const n of names) {
					for (const e of exts) {
						candidates.push(`${base}${n}.${e}`);
					}
				}
			}
			// Also add a small set of numbered guesses in the per-game base specifically
			try {
				const page = getPageType && getPageType();
				const slug = getGameSlug && getGameSlug();
				if (page === 'game' && slug) {
					const pg = `assets/games/background-music/${slug}/`;
					for (let i = 1; i <= 5; i++) {
						for (const e of exts) candidates.push(`${pg}track-${i}.${e}`);
					}
				}
			} catch {}
			// Deduplicate
			const seen = new Set();
			const uniq = candidates.filter(u => (seen.has(u) ? false : (seen.add(u), true)));
			const found = [];
			// Probe in manageable chunks to avoid flooding
			for (const url of uniq) {
				// Stop early if we already have a decent playlist
				if (found.length >= 25) break;
				/* eslint-disable no-await-in-loop */
				if (await headExists(url)) found.push(url);
			}
			return found;
		}

		// Quick per-game probe: try a small set of common filenames in the game's folder with a short timeout, resolve on first hit
		async function fastFindPerGameTrack(slug, timeoutMs = 700) {
			try {
				if (!slug) return null;
				const base = `assets/games/background-music/${slug}/`;
				const quickNames = [
					'background-music','background-music-1','bgm','background','theme','main','menu','track','track-1','music','music-1',
					slug, `${slug}-theme`, `${slug}-bgm`, `${slug}-music`, `${slug}-track-1`, `${slug}-music-1`
				];
				const urls = [];
				for (const n of quickNames) {
					for (const e of exts) { urls.push(`${base}${n}.${e}`); }
					if (urls.length > 48) break;
				}
				return await new Promise((resolve) => {
					let resolved = false; let pending = urls.length;
					if (!pending) { resolve(null); return; }
					const timer = setTimeout(() => { if (!resolved) { resolved = true; resolve(null); } }, timeoutMs);
					urls.forEach(u => {
						headExists(u).then(ok => {
							if (ok && !resolved) { resolved = true; clearTimeout(timer); resolve(u); }
						}).catch(() => {}).finally(() => {
							pending--; if (pending === 0 && !resolved) { clearTimeout(timer); resolved = true; resolve(null); }
						});
					});
				});
			} catch { return null; }
		}

		const audio = new Audio();
	// Hint for mobile browsers
	audio.setAttribute('playsinline', '');
	audio.setAttribute('webkit-playsinline', '');
	try {
		// Add to DOM increases compatibility on some mobile browsers
		audio.style.position = 'absolute';
		audio.style.width = '0';
		audio.style.height = '0';
		audio.style.opacity = '0';
		audio.style.pointerEvents = 'none';
		document.body.appendChild(audio);
	} catch {}
	audio.volume = 0; // start muted, we'll fade in
	audio.preload = 'auto';
	audio.loop = false;
	audio.autoplay = true;

	const FADE_INTERVAL_MS = 120; // smoothness
	const FADE_DURATION_MS = 2000; // fade length
	const MAX_VOL = 0.1; // cap overall volume at 10%
	const PREF_KEY = 'sound-pref'; // 'on' | 'off'
	const VOL_KEY = 'bgm-volume'; // persisted background music volume (0..MAX_VOL)
	const LAST_URL_KEY = 'bgm-last-url';
	const LAST_POS_KEY = 'bgm-last-pos';
	// Persisted user-preferred background music volume; default to MAX_VOL
	let userBgmVol = (() => {
		try {
			const raw = localStorage.getItem(VOL_KEY);
			if (!raw) return MAX_VOL;
			const v = parseFloat(raw);
			if (!isFinite(v)) return MAX_VOL;
			return Math.max(0, Math.min(MAX_VOL, v));
		} catch { return MAX_VOL; }
	})();
	function getTargetVol(){ return Math.max(0, Math.min(MAX_VOL, userBgmVol)); }
	const isMobileLike = () => (
		window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches
	) || (window.innerWidth <= 600);

		let recent = []; // keep last 3 indices
		let tracks = []; // discovered playlist
	let fadeTimer = null;
	let unlocked = false; // moved up so other functions can check it
	// Prevent audible fade-up on game pages until we confirm a per-game track or rule it out
	let allowAudible = true;
	try { const __pt = (getPageType && getPageType()); if (__pt === 'game') allowAudible = false; } catch {}
	// Guard against unintended early replays caused by redundant src assignment
	let firstTrackCommitted = false; // becomes true once initial intended track starts
	let lastSrcSetAt = 0; // timestamp of last src change

	// Simple sound toggle UI (index only) — placed in header top-right
	let toggleEl = null;
	let hintEl = null;
	let hintShown = false;
	let prefOn = (localStorage.getItem(PREF_KEY) || 'on') !== 'off';
	function ensureMusicToggle() {
		if (toggleEl) return toggleEl;
		toggleEl = document.createElement('button');
		toggleEl.className = 'music-toggle';
		toggleEl.type = 'button';
	// Icon-only; use classes for on/off images
		toggleEl.setAttribute('aria-pressed', 'false');
		// Insert into header (top-right)
		const header = document.querySelector('header');
		if (header) {
			header.appendChild(toggleEl);
			header.classList.add('has-music-toggle');
		} else {
			// Fallback to body if header missing
			document.body.appendChild(toggleEl);
		}
		// Initialize icon immediately from saved preference
		updateToggleLabel();
		toggleEl.addEventListener('click', () => {
			// Toggle preference first and reflect immediately
			prefOn = !prefOn;
			localStorage.setItem(PREF_KEY, prefOn ? 'on' : 'off');
			updateToggleLabel();
			// Treat as explicit user gesture unlock (after pref flip)
			if (!unlocked) onFirstUserGesture();
			if (prefOn) {
					// Ensure we have a source and are playing
					if (!audio.src) {
						let started = false;
						try {
							const lastUrl = localStorage.getItem(LAST_URL_KEY);
							if (lastUrl && Array.isArray(tracks) && tracks.includes(lastUrl)) {
								const page = getPageType && getPageType();
								const slug = getGameSlug && getGameSlug();
								let allow = false;
								if (page === 'index') allow = isFromGeneral(lastUrl);
								else if (page === 'game' && slug) allow = lastUrl.indexOf(`assets/games/background-music/${slug}/`) === 0;
								if (allow) {
									audio.src = lastUrl;
									const lastPos = parseFloat(localStorage.getItem(LAST_POS_KEY) || '0');
									if (isFinite(lastPos) && lastPos > 0) {
										const setPos = () => { try { audio.currentTime = lastPos; } catch {} };
										if ((audio.readyState || 0) >= 1) setPos(); else audio.addEventListener('loadedmetadata', setPos, { once: true });
									}
									audio.play().catch(() => {});
									started = true;
								}
							}
						} catch {}
						if (!started) {
							if (Array.isArray(tracks) && tracks.length > 0) {
								playNext();
							} else {
								audio.src = FALLBACK;
								audio.currentTime = 0;
								audio.play().catch(() => {});
							}
						}
				} else if (audio.paused) {
					audio.play().catch(() => {});
				}
						audio.muted = false;
						maybeFadeUp();
			} else {
				fadeTo(0, () => { audio.muted = true; audio.pause(); });
			}
		});
		return toggleEl;
	}

	function updateToggleLabel() {
		if (!toggleEl) return;
	const on = !!prefOn;
	toggleEl.classList.toggle('on', on);
	toggleEl.classList.toggle('off', !on);
	toggleEl.setAttribute('aria-pressed', on ? 'true' : 'false');
	toggleEl.setAttribute('aria-label', on ? 'Sound on' : 'Sound off');
	}

	function showHintOnce() {
		if (hintShown || isMobileLike()) return; // no hint on mobile
		hintShown = true;
		if (!hintEl) {
			hintEl = document.createElement('div');
			hintEl.className = 'music-hint';
			hintEl.textContent = 'Click to enable sound';
			document.body.appendChild(hintEl);
		}
		hintEl.style.display = 'block';
		setTimeout(() => { if (hintEl) hintEl.style.display = 'none'; }, 3500);
	}

	function pickNextIndex() {
		const count = tracks.length;
		if (count <= 1) return 0; // only one track
		const all = tracks.map((_, i) => i);
		// Avoid immediate repeat: exclude current if any
		const last = recent[recent.length - 1];
		let pool = all;
		if (typeof last === 'number' && count > 1) {
			pool = all.filter(i => i !== last);
		}
		const idx = pool[Math.floor(Math.random() * pool.length)];
		recent.push(idx);
		if (recent.length > 3) recent.shift();
		return idx;
	}

	function fadeTo(targetVol, cb) {
		if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
		const startVol = audio.volume;
		const delta = targetVol - startVol;
		if (Math.abs(delta) < 0.001) { audio.volume = targetVol; cb && cb(); return; }
		const steps = Math.max(1, Math.round(FADE_DURATION_MS / FADE_INTERVAL_MS));
		let n = 0;
		fadeTimer = setInterval(() => {
			n++;
			const t = Math.min(1, n / steps);
			audio.volume = Math.max(0, Math.min(MAX_VOL, startVol + delta * t));
			if (t >= 1) {
				clearInterval(fadeTimer); fadeTimer = null;
				if (targetVol > 0) {
					userBgmVol = Math.max(0, Math.min(MAX_VOL, targetVol));
					try { localStorage.setItem(VOL_KEY, String(userBgmVol)); } catch {}
				}
				cb && cb();
			}
		}, FADE_INTERVAL_MS);
	}

	function maybeFadeUp(){
		try {
				if (prefOn && allowAudible) {
					if (audio.muted) audio.muted = false;
					fadeTo(getTargetVol());
			}
		} catch {}
	}

		function playNext() {
			const idx = pickNextIndex();
			audio.src = tracks[idx];
		audio.currentTime = 0;
		// Keep muted if user prefers off; otherwise only until user unlocks
		audio.muted = !prefOn || !unlocked;
		audio.play().then(() => {
			// Wait for user to interact to unmute and fade in
			requestUserUnlock();
			tryUnmuteIfAllowed();
			setTimeout(maybeShowToggle, 800);
		}).catch(() => {
			// If even muted autoplay is blocked, request unlock
			requestUserUnlock();
			maybeShowToggle(true);
		});
	}

	// Start something immediately (muted) so a quick first tap can unmute it on mobile
	async function bootstrapPlay() {
		if (!prefOn) {
			// Respect user's muted preference: don't start playback at all
			return;
		}
		if (!audio.src) {
			const page = getPageType && getPageType();
			const slug = getGameSlug && getGameSlug();
			let set = false;
			// On game page: blocking fast per-game discovery (short) so we start correct track immediately if it exists
			if (page === 'game' && slug) {
				try {
					const cacheKeyUrl = `bgm-pergame-url:${slug}`;
					const cacheKeyNone = `bgm-pergame-none:${slug}`;
					const cachedUrl = localStorage.getItem(cacheKeyUrl);
					const cachedNone = localStorage.getItem(cacheKeyNone);
					if (cachedUrl) {
						if (audio.src !== cachedUrl) { audio.src = cachedUrl; lastSrcSetAt = Date.now(); }
						set = true; allowAudible = true;
					} else {
						const url = await fastFindPerGameTrack(slug, 650);
							if (url) {
								try { localStorage.setItem(cacheKeyUrl, url); localStorage.removeItem(cacheKeyNone); } catch {}
								if (audio.src !== url) { audio.src = url; lastSrcSetAt = Date.now(); }
								set = true; allowAudible = true;
						} else {
							try { localStorage.setItem(cacheKeyNone, '1'); localStorage.removeItem(cacheKeyUrl); } catch {}
							allowAudible = true; // no per-game track
						}
					}
				} catch {}
			}
			// Try to resume last known track, but only if appropriate for this page
			try {
				if (!set) {
					const lastUrl = localStorage.getItem(LAST_URL_KEY);
					if (lastUrl) {
						let allow = false;
						if (page === 'index') allow = isFromGeneral(lastUrl);
						else if (page === 'game' && slug) allow = lastUrl.indexOf(`assets/games/background-music/${slug}/`) === 0;
						if (allow) {
							audio.src = lastUrl;
							const lastPos = parseFloat(localStorage.getItem(LAST_POS_KEY) || '0');
							if (isFinite(lastPos) && lastPos > 0) {
								const setPos = () => { try { audio.currentTime = lastPos; } catch {} };
								if ((audio.readyState || 0) >= 1) setPos(); else audio.addEventListener('loadedmetadata', setPos, { once: true });
							}
							set = true;
						}
					}
				}
			} catch {}
			if (!set && !audio.src) { audio.src = FALLBACK; lastSrcSetAt = Date.now(); }
		}
		// If we explicitly set a last position above, keep it; otherwise start at 0
		if ((audio.currentTime || 0) === 0) audio.currentTime = 0;
		audio.muted = !prefOn; // honor saved preference
		audio.play().then(() => {
			if (!firstTrackCommitted) firstTrackCommitted = true;
			tryUnmuteIfAllowed();
			setTimeout(tryUnmuteIfAllowed, 300);
			setTimeout(tryUnmuteIfAllowed, 1500);
			setTimeout(maybeShowToggle, 1600);
		}).catch(() => {});
		requestUserUnlock();
	}

	// If playback starts and we're unmuted or allowed, ensure we fade up to target volume
	audio.addEventListener('play', () => {
		if (!audio.muted && audio.volume < MAX_VOL) {
				maybeFadeUp();
		}
	});

	function tryUnmuteIfAllowed() {
			if (unlocked || !prefOn) return; // handled by gesture or user turned off
		// Attempt to unmute if the browser allows audible autoplay (desktop/site permission)
		const wasMuted = audio.muted;
		const prevVol = audio.volume;
		try {
			audio.muted = false;
			audio.volume = 0;
				audio.play().then(() => {
					// Mark as unlocked so future tracks don't re-mute
						unlocked = true;
						maybeFadeUp();
			}).catch(() => {
				// Revert if not allowed
				audio.muted = wasMuted;
				audio.volume = prevVol;
					maybeShowToggle(true);
			});
		} catch {
			// Ignore and keep muted
		}
	}

	// Show the toggle if autoplay remains muted after a short delay (typical desktop policy)
	function maybeShowToggle(autoplayBlocked = false) {
		ensureMusicToggle();
		updateToggleLabel();
		// Always show the toggle; optionally show a brief hint when blocked and preference is on
		if (autoplayBlocked && prefOn && !unlocked) {
			showHintOnce();
		}
	}

		audio.addEventListener('ended', () => {
		if (!prefOn) { return; }
		// If only one track, loop with fade-in at restart
		if (tracks.length <= 1) {
				audio.currentTime = 0;
				audio.volume = 0;
				audio.muted = !unlocked;
					audio.play().then(() => maybeFadeUp()).catch(() => requestUserUnlock());
			return;
		}
		// Otherwise shuffle next (no immediate repeat)
			audio.volume = 0;
		playNext();
	});

	// Persist current track URL and playhead occasionally (scoped by page)
	setInterval(() => {
		try {
			if (audio && audio.src) {
				const page = getPageType && getPageType();
				const slug = getGameSlug && getGameSlug();
				let allow = false;
				if (page === 'index') {
					// Only persist general library on index
					allow = isFromGeneral(audio.src);
				} else if (page === 'game' && slug) {
					// Only persist per-game URL if it belongs to this game
					allow = audio.src.indexOf(`assets/games/background-music/${slug}/`) === 0;
				}
				if (allow) localStorage.setItem(LAST_URL_KEY, audio.src);
			}
			if (!isNaN(audio.currentTime)) localStorage.setItem(LAST_POS_KEY, String(Math.floor(audio.currentTime)));
		} catch {}
	}, 4000);

	// Optional: fade out just before the end of the track
	audio.addEventListener('timeupdate', () => {
		// Only apply near-end fade if we have a real duration (>= 15s) to avoid early false fades
		if (!audio.duration || !isFinite(audio.duration) || audio.duration < 15) return;
		const remaining = audio.duration - audio.currentTime;
		if (remaining > 0 && remaining < 2.2 && audio.volume > 0.01) {
			fadeTo(0);
		}
	});

	function onFirstUserGesture() {
		if (unlocked) return;
		unlocked = true;
		document.removeEventListener('click', onFirstUserGesture);
		document.removeEventListener('keydown', onFirstUserGesture);
		document.removeEventListener('pointerdown', onFirstUserGesture);
		document.removeEventListener('touchstart', onFirstUserGesture);
		document.removeEventListener('pointerup', onFirstUserGesture);
		document.removeEventListener('touchend', onFirstUserGesture);
		document.removeEventListener('scroll', onFirstUserGesture);
		document.removeEventListener('mousemove', onFirstUserGesture);
		// Only start/resume playback if user preference is ON
		if (prefOn) {
				audio.muted = false;
			maybeFadeUp();
			if (audio.paused) {
				audio.play().catch(() => {});
			}
		}
		maybeShowToggle();
	}

	function requestUserUnlock() {
		if (unlocked) return;
		document.addEventListener('click', onFirstUserGesture, { once: true });
		document.addEventListener('keydown', onFirstUserGesture, { once: true });
		document.addEventListener('pointerdown', onFirstUserGesture, { once: true });
		document.addEventListener('pointerup', onFirstUserGesture, { once: true });
		document.addEventListener('touchstart', onFirstUserGesture, { once: true, passive: true });
		document.addEventListener('touchend', onFirstUserGesture, { once: true, passive: true });
		document.addEventListener('scroll', onFirstUserGesture, { once: true, passive: true });
		document.addEventListener('mousemove', onFirstUserGesture, { once: true });
	}

	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible' && prefOn) {
			// Ensure we have a source ready, then resume promptly
			if (!audio.src || (audio.readyState || 0) < 2) {
				audio.src = FALLBACK;
				audio.currentTime = 0;
			}
			if (audio.paused) {
				audio.play().catch(() => {});
			}
			tryUnmuteIfAllowed();
		}
	});

	// When returning via back/forward cache, resume quickly
	window.addEventListener('pageshow', (e) => {
		if (!isIndex) return;
		if (prefOn) {
			// If we're on the index and playing a per-game track, switch back to general
			if (audio.src && !isFromGeneral(audio.src)) {
				const switchToGeneral = () => {
					audio.src = FALLBACK;
					audio.currentTime = 0;
					audio.muted = !unlocked;
					audio.play().then(() => maybeFadeUp()).catch(() => requestUserUnlock());
				};
				fadeTo(0, switchToGeneral);
			} else {
				// Ensure a ready general source and resume immediately
				if (!audio.src || (audio.readyState || 0) < 2) {
					audio.src = FALLBACK;
					audio.currentTime = 0;
				}
				if (audio.paused) {
					audio.play().catch(() => {});
				}
				tryUnmuteIfAllowed();
			}
		}
	});

			(async () => {
			// Create the toggle immediately so it appears instantly
			ensureMusicToggle();
			updateToggleLabel();
			// Request unlock listeners ASAP and attempt a muted fallback right away
			await bootstrapPlay();
				tracks = await discoverTracks();
			// If discovery failed for any reason, keep at least the baseline file
			if (!tracks || tracks.length === 0) {
				tracks = [FALLBACK];
			}
			// If still empty, bail
			if (!tracks.length) return;
			// On game pages, if per-game tracks exist, switch to one immediately (unless already committed)
			try {
				const page = getPageType && getPageType();
				const slug = getGameSlug && getGameSlug();
				if (page === 'game' && slug && prefOn) {
					const perGameBase = `assets/games/background-music/${slug}/`;
					const perGameTracks = tracks.filter(u => typeof u === 'string' && u.indexOf(perGameBase) === 0);
					if (perGameTracks.length && !firstTrackCommitted) {
						const pick = perGameTracks[Math.floor(Math.random() * perGameTracks.length)];
						const doSwitch = () => {
							if (audio.src === pick && audio.currentTime > 1) { firstTrackCommitted = true; return; }
							if (audio.src !== pick) { audio.src = pick; lastSrcSetAt = Date.now(); }
							// Only reset time if new track
							if (audio.currentTime < 0.5) audio.currentTime = 0;
							audio.muted = !unlocked;
							audio.play().then(() => { allowAudible = true; firstTrackCommitted = true; maybeFadeUp(); }).catch(() => requestUserUnlock());
							try { localStorage.setItem('bgm-origin', 'per-game'); } catch {}
						};
						// If something already playing, fade out then switch; else just switch
						if (!audio.paused && (audio.src || '').indexOf(perGameBase) !== 0) {
							fadeTo(0, doSwitch);
						} else if (!audio.src) {
							doSwitch();
						}
					} else {
						// No per-game tracks; allow general audio to be audible
						allowAudible = true;
					}
				}
			} catch {}
			// Otherwise, if nothing is set yet, start playback
			if (prefOn && !audio.src) {
				playNext();
			}
			setTimeout(maybeShowToggle, 1000);
		})();

	// Auto-rotate the focused card's cover media on index
	(function initAutoRotateCovers(){
		const isIndexHere = document.documentElement.getAttribute('data-page') === 'index';
		if (!isIndexHere) return;
		let focused = null;
		let rafId = 0;
		function computeFocused(){
			const games = document.querySelectorAll('#games-container .game');
			const cy = window.innerHeight / 2;
			let candidate = null;
			let bestDist = Infinity;
			// Single pass: nearest visible section by center distance
			games.forEach(game => {
				const rc = game.getBoundingClientRect();
				if (rc.bottom <= 0 || rc.top >= window.innerHeight) return; // offscreen
				const dist = Math.abs((rc.top + rc.height/2) - cy);
				if (dist < bestDist) { bestDist = dist; candidate = game; }
			});
			const best = candidate;
			if (focused !== best) {
				if (focused) focused.classList.remove('focused');
				focused = best;
				if (focused) {
					focused.classList.add('focused');
					const cov = focused.querySelector('.cover');
					const ctl = cov && cov._inline;
					if (ctl) {
						// Clear any lingering user hold on focus change so the centered item rotates
						ctl.userHoldUntil = null;
						ctl.lastAdvanceAt = Date.now();
						ctl.endedAt = null;
						if (ctl._progressWrap) ctl._progressWrap.classList.add('hidden');
						if (ctl._progressBar) ctl._progressBar.style.width = '0%';
						try { enforceSingleAudible(); } catch {}
					}
				}
			}
		}
		let scrollDebounce = 0;
		const onScrollOrResize = () => {
			if (rafId) cancelAnimationFrame(rafId);
			rafId = requestAnimationFrame(computeFocused);
			if (scrollDebounce) clearTimeout(scrollDebounce);
			scrollDebounce = setTimeout(computeFocused, 60);
		};
		window.addEventListener('scroll', onScrollOrResize, { passive: true });
		window.addEventListener('resize', onScrollOrResize);
		window.addEventListener('gamesRendered', () => setTimeout(computeFocused, 0));
		window.addEventListener('coversReady', () => setTimeout(computeFocused, 0));
		// Debounced initial compute to allow layout to settle
		setTimeout(computeFocused, 50);
		setTimeout(computeFocused, 200);

		let timer = null;
		let globalVideoUnmutedPref = false; // user preference: if they unmute any inline video
		let inlineVolumePref = (() => {
			try {
				const raw = localStorage.getItem('ogvInlineVolume');
				if (!raw) return null;
				const v = parseFloat(raw);
				if (!isFinite(v)) return null;
				return Math.min(1, Math.max(0, v));
			} catch { return null; }
		})();
		function advanceOne(ctl){
			if (!ctl || !ctl.items || ctl.items.length === 0) return;
			// Visible check: prefer IO flag, but fall back to geometry to avoid async lag
			let isVisible = ctl.inView !== false;
			if (!isVisible && ctl.el) {
				const rc = ctl.el.getBoundingClientRect();
				isVisible = (rc.bottom > 0 && rc.top < window.innerHeight);
			}
			if (!isVisible) return; // only active when visible
			const now = Date.now();
			if (ctl.userHoldUntil && now < ctl.userHoldUntil) return;
			if (ctl.userHoldUntil && now >= ctl.userHoldUntil) {
				ctl.userHoldUntil = null; ctl.lastAdvanceAt = now; ctl.endedAt = null;
			}
			if (ctl.currentIsVideo()) {
				const v = ctl.getCurrentVideoEl();
				if (v) {
					if (!v.ended) { ctl.endedAt = null; ctl.lastAdvanceAt = now; return; }
					v.autoplay = false;
					if (!ctl.endedAt) ctl.endedAt = now;
					if ((now - ctl.endedAt) >= 5000) { ctl.endedAt = null; ctl.lastAdvanceAt = now; ctl.next(); }
				}
			} else {
				if (!ctl.lastAdvanceAt) ctl.lastAdvanceAt = now;
				if ((now - ctl.lastAdvanceAt) >= 5000) { ctl.lastAdvanceAt = now; ctl.next(); }
			}
		}
		function tick(){
			// Advance the focused cover every second
			if (focused) {
				const cov = focused.querySelector('.cover');
				advanceOne(cov && cov._inline);
			}
			// Advance all other visible covers as well
			const visibles = document.querySelectorAll('#games-container .cover');
			visibles.forEach(c => {
				const ctl = c._inline; if (!ctl) return;
				const v = ctl.getCurrentVideoEl && ctl.getCurrentVideoEl();
				// Pause if fully offscreen; otherwise allow resume
				let isVisible = ctl.inView !== false;
				if (!isVisible && ctl.el) {
					const rc = ctl.el.getBoundingClientRect();
					isVisible = (rc.bottom > 0 && rc.top < window.innerHeight);
				}
				if (!isVisible) { if (v && !v.paused) v.pause(); return; }
				if (v && ctl.pausedByVisibility && v.paused && !v.ended) { v.play?.().catch(() => {}); ctl.pausedByVisibility = false; }
				if (c.closest('.game') !== focused) advanceOne(ctl);
			});
			// Keep audio focus in sync with focus and visibility
			enforceSingleAudible();
		}
		function start(){ if (timer) clearInterval(timer); timer = setInterval(tick, 1000); }
		function stop(){ if (timer) { clearInterval(timer); timer = null; } }

		// Smooth progress bar updater using rAF across all visible covers
		let progRaf = 0;
		function updateProgress(){
			const now = Date.now();
			const covers = document.querySelectorAll('#games-container .cover');
			covers.forEach(cov => {
				const ctl = cov && cov._inline; if (!ctl || !ctl._progressBar || !ctl._progressWrap) return;
				const bar = ctl._progressBar; const wrap = ctl._progressWrap;
				// Visibility: prefer IO flag, else geometry
				let isVisible = ctl.inView !== false;
				if (!isVisible && ctl.el) {
					const rc = ctl.el.getBoundingClientRect();
					isVisible = (rc.bottom > 0 && rc.top < window.innerHeight);
				}
				if (!isVisible) {
					wrap.classList.add('hidden');
					bar.style.width = '0%';
					return;
				}
				// Respect user hold: hide during hold
				if (ctl.userHoldUntil && now < ctl.userHoldUntil) {
					wrap.classList.add('hidden');
					bar.style.width = '0%';
					return;
				}
				let pct = 0;
				if (ctl.currentIsVideo()) {
					const v = ctl.getCurrentVideoEl();
					if (v && !v.ended) {
						wrap.classList.add('hidden');
						bar.style.width = '0%';
						return;
					} else if (v && ctl.endedAt) {
						const waitMs = 5000;
						pct = Math.min(100, Math.max(0, ((now - ctl.endedAt) / waitMs) * 100));
					}
				} else {
					const waitMs = 5000;
					const started = ctl.lastAdvanceAt || now;
					pct = Math.min(100, Math.max(0, ((now - started) / waitMs) * 100));
				}
				bar.style.width = pct + '%';
				if (!ctl.currentIsVideo() || (ctl.currentIsVideo() && ctl.endedAt)) wrap.classList.remove('hidden');
			});
			progRaf = requestAnimationFrame(updateProgress);
		}
		function startProgress(){ if (!progRaf) progRaf = requestAnimationFrame(updateProgress); }
		function stopProgress(){ if (progRaf) { cancelAnimationFrame(progRaf); progRaf = 0; } }
		// Track user mute changes to adopt as a global preference
		document.addEventListener('volumechange', (e) => {
			const t = e.target;
			if (!(t && t.tagName === 'VIDEO')) return;
			// Only consider inline cover videos
			const cov = t.closest('.cover');
			if (!cov || !cov._inline) return;
			// Update unmute preference and remember volume level
			const vol = (typeof t.volume === 'number') ? t.volume : 1;
			globalVideoUnmutedPref = !t.muted && vol > 0;
			inlineVolumePref = Math.min(1, Math.max(0, vol));
			try { localStorage.setItem('ogvInlineVolume', String(inlineVolumePref)); } catch {}
		}, true);

		function enforceSingleAudible(){
			const vids = document.querySelectorAll('#games-container .cover video');
			vids.forEach(v => { v.muted = true; });
			if (focused && globalVideoUnmutedPref) {
				const cov = focused.querySelector('.cover');
				const ctl = cov && cov._inline;
				const v = cov && cov.querySelector('video');
				if (v && ctl) {
					// Only unmute when visible to avoid offscreen audio
					let isVisible = ctl.inView !== false;
					if (!isVisible && ctl.el) {
						const rc = ctl.el.getBoundingClientRect();
						isVisible = (rc.bottom > 0 && rc.top < window.innerHeight);
					}
					if (isVisible) {
						v.muted = false;
						// Apply saved volume if available; fallback to 1 if still zero
						try {
							if (typeof inlineVolumePref === 'number') v.volume = inlineVolumePref;
							if ((v.volume || 0) === 0) v.volume = 1;
						} catch {}
					}
				}
			}
		}

		start();
		startProgress();
		window.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible') { start(); startProgress(); }
			else { stop(); stopProgress(); }
		});
	})();

		// Duck background music when any audible video is playing (index only)
		(function setupVideoAudioDucking(){
			try {
				function isAudible(v){
					if (!v) return false;
					const playing = !v.paused && !v.ended; // drop strict readyState check
					return playing && !v.muted && (v.volume || 0) > 0;
				}
				function anyAudibleVideo(){
					const vids = document.querySelectorAll('video');
					for (const v of vids) { if (isAudible(v)) return true; }
					return false;
				}
				function updateMusicForVideos(){
					if (!prefOn) return; // if user turned music off, don't change
					if (anyAudibleVideo()) fadeTo(0); else maybeFadeUp();
				}
				const onVideoEvent = (e) => {
					if (!(e && e.target && e.target.tagName === 'VIDEO')) return;
					// Run multiple short follow-ups to catch state transitions (decode -> playing)
					setTimeout(updateMusicForVideos, 0);
					setTimeout(updateMusicForVideos, 120);
					setTimeout(updateMusicForVideos, 350);
					setTimeout(updateMusicForVideos, 900);
				};
				document.addEventListener('play', onVideoEvent, true);
				document.addEventListener('playing', onVideoEvent, true);
				document.addEventListener('pause', onVideoEvent, true);
				document.addEventListener('ended', onVideoEvent, true);
				document.addEventListener('volumechange', onVideoEvent, true);
				document.addEventListener('seeking', onVideoEvent, true);
				document.addEventListener('seeked', onVideoEvent, true);
				// React to lightbox lifecycle and explicit lightbox video events, too
				['lightboxOpen','lightboxClose','lightboxVideoPlay','lightboxVideoPause','lightboxVideoVolume','lightboxVideoSeeking','lightboxVideoSeeked']
					.forEach(evt => window.addEventListener(evt, () => {
						setTimeout(updateMusicForVideos, 0);
						setTimeout(updateMusicForVideos, 120);
						setTimeout(updateMusicForVideos, 350);
					}, { passive: true }));
				window.addEventListener('gamesRendered', () => setTimeout(updateMusicForVideos, 0));
				// Initial pass in case a video is already playing (e.g., lightbox on game page)
				setTimeout(updateMusicForVideos, 0);
				setTimeout(updateMusicForVideos, 400);
			} catch {}
		})();
});