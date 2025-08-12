// Background music rotation for index page
document.addEventListener('DOMContentLoaded', () => {
	// Only run on main page (we tagged index by setting data-page in index.html before other scripts)
	const isIndex = document.documentElement.getAttribute('data-page') === 'index';

	// Build starfield background (run on all pages)
	(function initStarfield(){
		const sf = document.createElement('div');
		sf.className = 'starfield';
		document.body.appendChild(sf);
		const isMobile = matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth <= 600;
		const count = isMobile ? 80 : 140; // fewer stars on mobile
		// Add a few faint spiral galaxies on desktop only
		if (!isMobile) {
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
		// Shooting stars occasionally
		function shoot() {
			const sh = document.createElement('div');
			sh.className = 'shooting-star';
			// Spawn from a random edge and aim inward at a varied angle
			const edge = Math.floor(Math.random() * 4); // 0:left,1:right,2:top,3:bottom
			let angleDeg = 0;
			if (edge === 0) { // left -> right-ish
				sh.style.left = (-20 - Math.random() * 20) + 'vw';
				sh.style.top = (Math.random() * 100) + 'vh';
				angleDeg = (Math.random() * 90) - 45; // -45..45
			} else if (edge === 1) { // right -> left-ish
				sh.style.left = (120 + Math.random() * 20) + 'vw';
				sh.style.top = (Math.random() * 100) + 'vh';
				angleDeg = 180 + (Math.random() * 90 - 45); // 135..225
			} else if (edge === 2) { // top -> down-ish
				sh.style.left = (Math.random() * 100) + 'vw';
				sh.style.top = (-20 - Math.random() * 20) + 'vh';
				angleDeg = 90 + (Math.random() * 90 - 45); // 45..135
			} else { // bottom -> up-ish
				sh.style.left = (Math.random() * 100) + 'vw';
				sh.style.top = (120 + Math.random() * 20) + 'vh';
				angleDeg = -90 + (Math.random() * 90 - 45); // -135..-45
			}
			sh.style.setProperty('--angle', angleDeg + 'deg');
			const baseDur = 2.4 + Math.random() * 2.8; // current speed range
			// Sometimes speed up to 50% faster (i.e., duration reduced by up to 50%)
			const applySpeedUp = Math.random() < 0.6; // ~60% chance to be faster
			const speedFactor = applySpeedUp ? (1 - Math.random() * 0.5) : 1; // 0.5..1.0
			const dur = (baseDur * speedFactor).toFixed(2);
			sh.style.setProperty('--shoot-dur', dur + 's');
			sf.appendChild(sh);
			setTimeout(() => sh.remove(), (parseFloat(dur) * 1000) + 600);
			// Next shooting star after 6–14s
			setTimeout(shoot, 6000 + Math.random() * 8000);
		}
		setTimeout(shoot, 2000 + Math.random() * 6000);

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
					`assets/images/covers/${slug}-cover.webp`,
					`assets/images/covers/${slug}-cover.png`,
					`assets/images/covers/${slug}-cover.jpg`,
					`assets/images/covers/${slug}-cover.jpeg`,
					`assets/images/${slug}-cover.webp`,
					`assets/images/${slug}-cover.png`,
					`assets/images/${slug}-cover.jpg`,
					`assets/images/${slug}-cover.jpeg`
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

	// For non-index pages, stop here (starfield only)
	if (!isIndex) return;

	// Sync index card titles from the manifest so renames in games.json reflect on the main page
	(async function renderIndexFromManifest(){
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
			const sec = document.createElement('section');
			sec.className = 'game';
			sec.id = slug;
			sec.dataset.title = name;
			sec.dataset.folder = `assets/images/galleries/${slug}`;
			sec.innerHTML = `
				<div class="game-header">
					<h2><a href="game.html?g=${slug}">${name}</a></h2>
					<a class="btn view-btn" href="game.html?g=${slug}">View</a>
				</div>
				<div class="cover" data-game="${slug}"></div>`;
			container.appendChild(sec);
		}
		// After cards are rendered, build inline gallery viewers into each cover
		initInlineCoverViewers();
	})();

	async function initInlineCoverViewers() {
		const covers = document.querySelectorAll('#games-container .cover');
		for (const cov of covers) {
			const card = cov.closest('.game');
			const slug = card?.id || cov.getAttribute('data-game');
			const folder = card?.dataset.folder || (slug ? `assets/images/galleries/${slug}` : null);
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
					v.controls = true;
					v.playsInline = true;
					v.setAttribute('playsinline','');
					v.src = src;
					mediaWrap.appendChild(v);
				} else {
					const img = document.createElement('img');
					img.src = src;
					img.alt = (card?.dataset.title || slug || 'media');
					mediaWrap.appendChild(img);
				}
				prevBtn.style.display = items.length > 1 ? '' : 'none';
				nextBtn.style.display = items.length > 1 ? '' : 'none';
			}
			const next = () => { idx = (idx + 1) % items.length; render(); };
			const prev = () => { idx = (idx - 1 + items.length) % items.length; render(); };
			nextBtn.addEventListener('click', next);
			prevBtn.addEventListener('click', prev);
			render();
		}
	}

		const base = 'assets/audio/music/background/';
		const FALLBACK = base + 'background-music-1.mp3';
		const exts = ['mp3','ogg','webm','wav','m4a'];
		const names = [];
		// Common patterns
		for (let i = 1; i <= 20; i++) names.push(`background-music-${i}`);
		for (let i = 1; i <= 20; i++) names.push(`track-${i}`);
		for (let i = 1; i <= 20; i++) names.push(`music-${i}`);
		// Also try a few generic bases
		names.push('background', 'ambient', 'theme');

		async function headExists(url) {
			try {
				const res = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
				return res.ok;
			} catch {
				return false;
			}
		}

		async function discoverTracks() {
			const candidates = [];
			// Specific known file as a baseline candidate
			candidates.push(base + 'background-music-1.mp3');
			for (const n of names) {
				for (const e of exts) {
					candidates.push(`${base}${n}.${e}`);
				}
			}
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
	const isMobileLike = () => (
		window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches
	) || (window.innerWidth <= 600);

		let recent = []; // keep last 3 indices
		let tracks = []; // discovered playlist
	let fadeTimer = null;
	let unlocked = false; // moved up so other functions can check it

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
					if (Array.isArray(tracks) && tracks.length > 0) {
						playNext();
					} else {
						audio.src = FALLBACK;
						audio.currentTime = 0;
						audio.play().catch(() => {});
					}
				} else if (audio.paused) {
					audio.play().catch(() => {});
				}
				audio.muted = false;
				fadeTo(MAX_VOL);
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
			if (t >= 1) { clearInterval(fadeTimer); fadeTimer = null; cb && cb(); }
		}, FADE_INTERVAL_MS);
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
	function bootstrapPlay() {
		if (!prefOn) {
			// Respect user's muted preference: don't start playback at all
			return;
		}
		if (!audio.src) {
			audio.src = FALLBACK;
		}
		audio.currentTime = 0;
			audio.muted = !prefOn; // honor saved preference
		audio.play().then(() => {
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
			fadeTo(MAX_VOL);
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
					fadeTo(MAX_VOL);
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
		if (!isIndex) return;
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
				audio.play().then(() => fadeTo(MAX_VOL)).catch(() => requestUserUnlock());
			return;
		}
		// Otherwise shuffle next (no immediate repeat)
			audio.volume = 0;
		playNext();
	});

	// Optional: fade out just before the end of the track
	audio.addEventListener('timeupdate', () => {
		const remaining = (audio.duration || 0) - audio.currentTime;
		if (remaining > 0 && remaining < 2.2 && audio.volume > 0.01) {
			// Start fade out near the end; guard so it doesn't loop re-trigger
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
			fadeTo(MAX_VOL);
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
			// Ensure a ready source and resume immediately
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

			(async () => {
			// Create the toggle immediately so it appears instantly
			ensureMusicToggle();
			updateToggleLabel();
			// Request unlock listeners ASAP and attempt a muted fallback right away
			bootstrapPlay();
				tracks = await discoverTracks();
			// If discovery failed for any reason, keep at least the baseline file
			if (!tracks || tracks.length === 0) {
				tracks = [FALLBACK];
			}
			// If still empty, bail
			if (!tracks.length) return;
			if (prefOn) {
				playNext();
			}
			setTimeout(maybeShowToggle, 1000);
		})();
});