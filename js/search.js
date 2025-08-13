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

    // Sorting state (alphabetical by title)
    let sortMode = null; // 'asc' | 'desc' | null
    const SORT_PARAM = 'sort';
    const STORAGE_SORT = 'ogv:search:sort';

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
    const STORAGE_Q = 'ogv:search:q';
    const STORAGE_TAGS = 'ogv:search:tags';

    function syncURL(query) {
        const url = new URL(window.location);
        if (query) url.searchParams.set('q', query); else url.searchParams.delete('q');
        if (activeTags.size) url.searchParams.set(TAG_PARAM, Array.from(activeTags).join(',')); else url.searchParams.delete(TAG_PARAM);
        if (sortMode) url.searchParams.set(SORT_PARAM, sortMode); else url.searchParams.delete(SORT_PARAM);
        window.history.replaceState({}, '', url);
        // Persist state (session-based so a fresh tab starts clean)
        try {
            if (query) sessionStorage.setItem(STORAGE_Q, query); else sessionStorage.removeItem(STORAGE_Q);
            if (activeTags.size) sessionStorage.setItem(STORAGE_TAGS, Array.from(activeTags).join(',')); else sessionStorage.removeItem(STORAGE_TAGS);
            if (sortMode) sessionStorage.setItem(STORAGE_SORT, sortMode); else sessionStorage.removeItem(STORAGE_SORT);
        } catch {}
    }

    function parseURLState() {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        const tagStr = params.get(TAG_PARAM);
        activeTags.clear();
        if (tagStr) tagStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).forEach(t => activeTags.add(t));
    const s = params.get(SORT_PARAM);
    sortMode = (s === 'asc' || s === 'desc') ? s : null;
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

        // Sorting section
        // Insert Clear Filters button directly under tag grid (before sorting)
        const tagActions = document.createElement('div');
        tagActions.className = 'filter-actions';
        const clearBtn = document.createElement('button');
        clearBtn.type = 'button';
        clearBtn.className = 'clear-filters-btn';
        clearBtn.textContent = 'Clear Filters';
        clearBtn.disabled = activeTags.size === 0;
        clearBtn.addEventListener('click', () => { activeTags.clear(); searchGames(); buildFilterMenu(); updateFilterToggleState(); });
        tagActions.appendChild(clearBtn);
        filterMenu.appendChild(tagActions);

        // Sorting section (uses same heading style as Filters h3)
        const sortSection = document.createElement('div');
        sortSection.className = 'filter-sort-section';
        const sortHeading = document.createElement('h3');
        sortHeading.textContent = 'Sorting';
        sortSection.appendChild(sortHeading);
        // Sorting mode buttons (future-proof for other modes like date)
        const sortModeWrap = document.createElement('div');
        sortModeWrap.className = 'sort-modes';
        const alphaBtn = document.createElement('button');
        alphaBtn.type = 'button';
        alphaBtn.className = 'filter-tag sort-mode';
        alphaBtn.textContent = 'Alphabetical';
        // Only mode currently; always active visually
        alphaBtn.classList.add('active');
        sortModeWrap.appendChild(alphaBtn);
        sortSection.appendChild(sortModeWrap);
        // Asc / Desc controls
        const orderWrap = document.createElement('div');
        orderWrap.className = 'sort-btns';
        ['asc','desc'].forEach(mode => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'filter-tag sort-option';
            b.dataset.sort = mode;
            b.textContent = mode === 'asc' ? '↑' : '↓';
            b.setAttribute('aria-label', mode === 'asc' ? 'Sort ascending' : 'Sort descending');
            if ((sortMode || 'asc') === mode) b.classList.add('active');
            b.addEventListener('click', () => { setSortMode(mode); });
            orderWrap.appendChild(b);
        });
        sortSection.appendChild(orderWrap);
        filterMenu.appendChild(sortSection);
        filterMenu.scrollTop = hadScroll; // preserve scroll
    }

    function setSortMode(mode) {
    // Null disables; otherwise set new mode (default to 'asc' when enabling without explicit value)
    if (!mode) sortMode = null; else sortMode = mode;
        searchGames();
        buildFilterMenu();
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

    function highlightMatchingTags() {
        // Highlight tags in each game that match active filter tags
        if (!gamesContainer) return;
        const cards = gamesContainer.querySelectorAll('.game');
        cards.forEach(card => {
            const tagsEl = card.querySelectorAll('.tag');
            tagsEl.forEach(tEl => {
                const name = tEl.textContent.trim().toLowerCase();
                if (activeTags.size && activeTags.has(name)) tEl.classList.add('matching-active'); else tEl.classList.remove('matching-active');
            });
        });
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
            if (!allGames.length) snapshotGames();
            let base = [...allGames];
            if (sortMode === 'asc') base.sort((a,b)=> (a.dataset.title||'').localeCompare(b.dataset.title||'', undefined, { sensitivity:'base' }));
            else if (sortMode === 'desc') base.sort((a,b)=> (b.dataset.title||'').localeCompare(a.dataset.title||'', undefined, { sensitivity:'base' }));
            base.forEach(g => gamesContainer.appendChild(g));
            applyStagger();
            highlightMatchingTags();
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

        if (sortMode === 'asc' || sortMode === 'desc') {
            // Filter by score>0 then sort alphabetically only
            results.sort((a,b)=> {
                const an = (a.element.dataset.title||'');
                const bn = (b.element.dataset.title||'');
                return sortMode === 'asc' ? an.localeCompare(bn, undefined, { sensitivity:'base' }) : bn.localeCompare(an, undefined, { sensitivity:'base' });
            });
        } else {
            results.sort((a, b) => b.s - a.s);
        }

        gamesContainer.innerHTML = "";
        if (results.length) {
            results.forEach(r => gamesContainer.appendChild(r.element));
            applyStagger();
            highlightMatchingTags();
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
        // If no URL params, restore from sessionStorage
        try {
            if (!q) {
                const storedQ = sessionStorage.getItem(STORAGE_Q);
                if (storedQ) searchBox.value = storedQ;
            }
            if (!activeTags.size) {
                const storedTags = sessionStorage.getItem(STORAGE_TAGS);
                if (storedTags) storedTags.split(',').map(t=>t.trim()).filter(Boolean).forEach(t=>activeTags.add(t));
            }
            if (!sortMode) {
                const storedSort = sessionStorage.getItem(STORAGE_SORT);
                if (storedSort === 'asc' || storedSort === 'desc') sortMode = storedSort;
            }
        } catch {}
    buildFilterMenu();
    updateFilterToggleState();
        if (searchBox.value || activeTags.size) { searchGames(); } else { applyStagger(); }
    }

    // Run once now and again after games are (re)rendered
    runInitial();
    window.addEventListener('gamesRendered', () => { snapshotGames(); buildFilterMenu(); runInitial(); });
});