document.addEventListener("DOMContentLoaded", () => {
    const searchBox = document.getElementById("search-box");
    const searchButton = document.getElementById("search-button");
    const gameList = document.getElementById("game-list");
    const gamesContainer = document.getElementById("games-container");
    const filterToggle = document.getElementById('filter-toggle');
    const filterMenu = document.getElementById('filter-menu');
    // Keep a stable snapshot of all game elements rendered from games.json
    let allGames = [];
    const snapshotGames = () => { allGames = Array.from(gamesContainer.querySelectorAll('.game')); };
    const status = document.getElementById("results-status");

    const score = (text, q) => {
        if (!q) return 0;
        if (text === q) return 5;
        if (text.startsWith(q)) return 3;
        if (text.includes(q)) return 1;
        return 0;
    };

    const applyStagger = () => {
        // Add a class to enable animation and set staggered delays
        if (!gamesContainer) return;
        gamesContainer.classList.remove('list-enter');
        // Force reflow so removing/adding the class restarts animations
        void gamesContainer.offsetWidth;
        const items = gamesContainer.querySelectorAll('.game');
            // Match CSS duration (first: 1040ms, subsequent animate in half the time 520ms)
            const DURATION_FIRST = 1040;
            const DURATION_OTHERS = 520;
            const HALF = Math.round(DURATION_FIRST * 0.5); // 520ms stagger gap
            items.forEach((el, i) => {
                el.style.setProperty('--stagger', `${i * HALF}ms`);
                el.style.setProperty('--dur', `${i === 0 ? DURATION_FIRST : DURATION_OTHERS}ms`);
            });
        gamesContainer.classList.add('list-enter');
        // Clean up the class after animation completes (roughly)
    // 1040ms anim + up to ~8*80ms stagger ≈ 1680ms; add buffer
        // Compute end time for the last item: lastDelay + its duration
        const lastIndex = Math.max(0, items.length - 1);
        const lastDelay = lastIndex * HALF;
        const lastDur = lastIndex === 0 ? DURATION_FIRST : DURATION_OTHERS;
        const totalTime = lastDelay + lastDur + 300; // buffer
            clearTimeout(gamesContainer._animTimer);
            gamesContainer._animTimer = setTimeout(() => {
                gamesContainer.classList.remove('list-enter');
            }, totalTime);
    };

    // Active tag filters (Set of lowercase tag names)
    const activeTags = new Set();
    const TAG_PARAM = 'tags';

    function syncURL(query) {
        const url = new URL(window.location);
        if (query) url.searchParams.set('q', query); else url.searchParams.delete('q');
        if (activeTags.size) url.searchParams.set(TAG_PARAM, Array.from(activeTags).join(',')); else url.searchParams.delete(TAG_PARAM);
        window.history.replaceState({}, '', url);
    }

    function parseURLState() {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        const tagStr = params.get(TAG_PARAM);
        activeTags.clear();
        if (tagStr) tagStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).forEach(t => activeTags.add(t));
        return q;
    }

    function buildFilterMenu() {
        if (!filterMenu) return;
        if (!allGames.length) snapshotGames();
        const tagCounts = new Map();
        allGames.forEach(g => {
            const tags = (g.dataset.tags || '').split(',').map(t => t.trim()).filter(Boolean);
            tags.forEach(t => tagCounts.set(t, (tagCounts.get(t) || 0) + 1));
        });
        const sorted = Array.from(tagCounts.entries()).sort((a,b) => a[0].localeCompare(b[0]));
        const hadScroll = filterMenu.scrollTop;
        filterMenu.innerHTML = '';
        const heading = document.createElement('h3');
        heading.textContent = 'Filters';
        filterMenu.appendChild(heading);
        const grid = document.createElement('div');
        grid.className = 'filter-tags-grid';
        sorted.forEach(([tag,count]) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'filter-tag';
            btn.dataset.tag = tag;
            btn.textContent = tag;
            btn.title = `${tag} (${count})`;
            if (activeTags.has(tag)) btn.classList.add('active');
            btn.addEventListener('click', () => { toggleTag(tag); });
            grid.appendChild(btn);
        });
        filterMenu.appendChild(grid);
        const actions = document.createElement('div');
        actions.className = 'filter-actions';
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'clear-filters-btn';
        clearBtn.textContent = 'Clear Filters';
        clearBtn.disabled = activeTags.size === 0;
        clearBtn.addEventListener('click', () => { activeTags.clear(); searchGames(); buildFilterMenu(); updateFilterToggleState(); });
        actions.appendChild(clearBtn);
        filterMenu.appendChild(actions);
        filterMenu.scrollTop = hadScroll; // preserve scroll
    }

    function toggleTag(tag) {
        if (activeTags.has(tag)) activeTags.delete(tag); else activeTags.add(tag);
        searchGames();
        buildFilterMenu();
        updateFilterToggleState();
    }

    function updateFilterToggleState() {
        if (!filterToggle) return;
        filterToggle.classList.toggle('has-filters', activeTags.size > 0);
        if (filterToggle.getAttribute('aria-expanded') === 'true') filterToggle.setAttribute('aria-expanded','true');
    }

    function closeFilterMenu() {
        if (!filterMenu || filterMenu.hasAttribute('hidden')) return;
        filterMenu.setAttribute('hidden','');
        filterToggle && filterToggle.setAttribute('aria-expanded','false');
    }
    function openFilterMenu() {
        if (!filterMenu) return;
        buildFilterMenu();
        filterMenu.removeAttribute('hidden');
    if (filterToggle) {
            // Anchor just below button, centered horizontally to button
            const btnRect = filterToggle.getBoundingClientRect();
            // Use absolute within search-container (position: relative implicit?) ensure container is positioned
            const container = filterToggle.closest('.search-container');
            if (container && getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }
            // Set a provisional width cap (auto height)
            filterMenu.style.width = 'auto';
            filterMenu.style.maxWidth = '420px';
            filterMenu.style.minWidth = '280px';
            // Measure now that content exists
            let menuRect = filterMenu.getBoundingClientRect();
            const desiredWidth = Math.min(420, Math.max(280, menuRect.width));
            filterMenu.style.width = desiredWidth + 'px';
            menuRect = filterMenu.getBoundingClientRect();
            // Center relative to button center
            let leftOffset = (btnRect.left + (btnRect.width / 2)) - (menuRect.width / 2);
            // Slight nudge to the right (5px) to visually align with icon optical center
            leftOffset += 5;
            const containerRect = container.getBoundingClientRect();
            const relativeLeft = leftOffset - containerRect.left;
            // Clamp within container
            const maxLeft = containerRect.width - menuRect.width;
            filterMenu.style.left = Math.max(0, Math.min(relativeLeft, maxLeft)) + 'px';
            filterMenu.style.top = (btnRect.bottom - containerRect.top + 6) + 'px';
            filterMenu.dataset.pos = 'anchored';
    }
        filterToggle && filterToggle.setAttribute('aria-expanded','true');
        updateFilterToggleState();
    }
    filterToggle && filterToggle.addEventListener('click', () => {
        if (filterMenu.hasAttribute('hidden')) openFilterMenu(); else closeFilterMenu();
    });
    document.addEventListener('click', (e) => {
        if (!filterMenu || filterMenu.hasAttribute('hidden')) return;
        if (filterMenu.contains(e.target) || filterToggle.contains(e.target)) return;
        closeFilterMenu();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeFilterMenu(); });

    const searchGames = () => {
        const raw = searchBox.value.trim();
        const query = raw.toLowerCase();
        // Support comma-separated tag filters e.g. "coop, multiplayer"
        const tagFilters = raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

    // Sync URL with current text + active tag selections (text tagFilters no longer implicitly apply multi-tag AND; explicit pills drive AND filtering)
    syncURL(query);

        // Empty query restores full list in original order
    if (!query && !activeTags.size) {
            status && (status.textContent = "Showing all games");
            gamesContainer.innerHTML = "";
            // Ensure we have a snapshot
            if (!allGames.length) snapshotGames();
            allGames.forEach(g => gamesContainer.appendChild(g));
            applyStagger();
            return;
        }

        const results = [];
        // Search against the full snapshot so we can reconstruct DOM even after an empty state message
        if (!allGames.length) snapshotGames();
        allGames.forEach((game) => {
            const title = (game.dataset.title || "").toLowerCase();
            const desc = (game.querySelector("p")?.textContent || "").toLowerCase();
            const tags = (game.dataset.tags || "").toLowerCase();
            const titleScore = score(title, query);
            const descScore = score(desc, query);
            const tagTextScore = score(tags, query);
            let s = titleScore * 3 + descScore * 2 + tagTextScore;
            const hadQuery = !!query;
            // Active filter tags (pills) require AND match
            if (activeTags.size) {
                const tagSet = tags.split(',').map(t => t.trim()).filter(Boolean);
                const allMatch = Array.from(activeTags).every(t => tagSet.includes(t));
                if (!allMatch) {
                    s = 0;
                } else {
                    // Only boost if query absent OR there was a base textual match
                    if (!hadQuery || s > 0) s += 12 * activeTags.size;
                }
            } else if (tagFilters.length === 1) {
                // Backwards compatibility: single word typed that matches a tag
                const f = tagFilters[0];
                if (f && tags.split(',').map(t => t.trim()).includes(f)) s += 8;
            } else if (tagFilters.length > 1) {
                // Comma-separated typed list (legacy) -> treat as AND as before
                const tagSet = tags.split(',').map(t => t.trim());
                const allMatch = tagFilters.every(f => tagSet.includes(f));
                if (allMatch) {
                    if (!hadQuery || s > 0) s += 10 * tagFilters.length; else s = 0;
                } else {
                    s = 0;
                }
            }
            // Final guard: if there is a query and no textual match at all, exclude regardless of tag-only boost attempts
            if (hadQuery && (titleScore + descScore + tagTextScore) === 0) s = 0;
            if (s > 0) results.push({ element: game, s });
        });

        results.sort((a, b) => b.s - a.s);

        gamesContainer.innerHTML = "";
        if (results.length) {
            results.forEach(r => gamesContainer.appendChild(r.element));
            applyStagger();
        } else {
            // Render friendly empty state but keep snapshot intact for next search
            gamesContainer.innerHTML = "<p>No games found.</p>";
        }

        if (status) {
            if (!query && activeTags.size) status.textContent = `${results.length} tagged game${results.length !== 1 ? 's' : ''}`;
            else status.textContent = results.length ? `${results.length} result${results.length !== 1 ? "s" : ""}` : "No games found";
        }

        if (results.length === 0) {
            gamesContainer.innerHTML = "<p>No games found.</p>";
        }
    };

    // Add event listeners
    searchButton.addEventListener("click", searchGames);
    searchBox.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            searchGames();
        }
    });

    function runInitial() {
        const q = parseURLState();
    buildFilterMenu();
    updateFilterToggleState();
        if (q) {
            searchBox.value = q;
            searchGames();
        } else {
            applyStagger();
        }
    }

    // Run once now and again after games are (re)rendered
    runInitial();
    window.addEventListener('gamesRendered', () => { snapshotGames(); buildFilterMenu(); runInitial(); });
});