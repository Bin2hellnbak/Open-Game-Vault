// Background music rotation for index page
document.addEventListener('DOMContentLoaded', () => {
	// Only run on main page (we tagged index by setting data-page in index.html before other scripts)
	const isIndex = document.documentElement.getAttribute('data-page') === 'index';

	// Build starfield background (run on all pages)
	(function initStarfield(){
		const sf = document.createElement('div');
		sf.className = 'starfield';
		document.body.appendChild(sf);
		const count = 140; // number of stars
		for (let i = 0; i < count; i++) {
			const s = document.createElement('div');
			s.className = 'star';
			if (Math.random() < 0.12) s.classList.add('big');
			if (Math.random() < 0.25) s.classList.add('dim');
			s.style.left = Math.random() * 100 + 'vw';
			s.style.top = Math.random() * 100 + 'vh';
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
	})();

	// For non-index pages, stop here (starfield only)
	if (!isIndex) return;

		const base = 'css/audio/music/background/';
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
	const MAX_VOL = 0.2; // cap overall volume at 20%
	const PREF_KEY = 'sound-pref'; // 'on' | 'off'
	const isMobileLike = () => (
		window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches
	) || (window.innerWidth <= 600);

		let recent = []; // keep last 3 indices
		let tracks = []; // discovered playlist
	let fadeTimer = null;
	let unlocked = false; // moved up so other functions can check it

	// Simple sound toggle UI (index only)
	let toggleEl = null;
	let hintEl = null;
	let hintShown = false;
	let prefOn = (localStorage.getItem(PREF_KEY) || 'on') !== 'off';
	function ensureMusicToggle() {
		if (toggleEl) return toggleEl;
		toggleEl = document.createElement('button');
		toggleEl.className = 'music-toggle';
		toggleEl.type = 'button';
		toggleEl.textContent = 'Sound: Off';
		toggleEl.setAttribute('aria-pressed', 'false');
		// Always visible on index; we'll update label/state
		toggleEl.style.display = 'block';
		toggleEl.addEventListener('click', () => {
			// Treat as explicit user gesture unlock
			if (!unlocked) onFirstUserGesture();
			// Toggle mute state
			const turningOn = audio.muted || audio.volume < 0.01;
			audio.muted = !turningOn;
			if (turningOn) {
				fadeTo(MAX_VOL);
				updateToggleLabel();
				prefOn = true; localStorage.setItem(PREF_KEY, 'on');
			} else {
				fadeTo(0, () => { audio.muted = true; });
				updateToggleLabel();
				prefOn = false; localStorage.setItem(PREF_KEY, 'off');
			}
		});
		document.body.appendChild(toggleEl);
		return toggleEl;
	}

	function updateToggleLabel() {
		if (!toggleEl) return;
		const on = !audio.muted && audio.volume > 0.01;
		toggleEl.textContent = on ? 'Sound: On' : 'Sound: Off';
		toggleEl.setAttribute('aria-pressed', on ? 'true' : 'false');
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
			if (isMobileLike()) return; // keep mobile UI clean; no toggle on mobile
		ensureMusicToggle();
		updateToggleLabel();
		// Always show the toggle; optionally show a brief hint when blocked and preference is on
		if (autoplayBlocked && prefOn && !unlocked) {
			showHintOnce();
		}
	}

	audio.addEventListener('ended', () => {
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
		// Unmute and fade in to target volume
		audio.muted = false;
		fadeTo(MAX_VOL);
		if (audio.paused) {
			audio.play().catch(() => {});
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
		if (document.visibilityState === 'visible' && !audio.paused) {
			// Ensure we keep playing when tab becomes visible again
			audio.play().catch(() => {});
		}
	});

			(async () => {
			// Request unlock listeners ASAP and attempt a muted fallback right away
			bootstrapPlay();
				tracks = await discoverTracks();
			// If discovery failed for any reason, keep at least the baseline file
			if (!tracks || tracks.length === 0) {
				tracks = [FALLBACK];
			}
			// If still empty, bail
			if (!tracks.length) return;
			playNext();
			setTimeout(maybeShowToggle, 1000);
		})();
});