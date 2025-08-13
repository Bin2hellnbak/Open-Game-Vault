document.addEventListener("DOMContentLoaded", () => {
    const searchBox = document.getElementById("search-box");
    const searchButton = document.getElementById("search-button");
    const gameList = document.getElementById("game-list");
    const gamesContainer = document.getElementById("games-container");
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

    const searchGames = () => {
        const query = searchBox.value.trim().toLowerCase();

        // Update URL query param
        const url = new URL(window.location);
        if (query) {
            url.searchParams.set("q", query);
        } else {
            url.searchParams.delete("q");
        }
        window.history.replaceState({}, "", url);

        // Empty query restores full list in original order
        if (!query) {
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

            const s = score(title, query) * 3 + score(desc, query) * 2 + score(tags, query);
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

        if (status) status.textContent = results.length ? `${results.length} result${results.length !== 1 ? "s" : ""}` : "No games found";

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
        const params = new URLSearchParams(window.location.search);
        const q = params.get("q");
        if (q) {
            searchBox.value = q;
            searchGames();
        } else {
            applyStagger();
        }
    }

    // Run once now and again after games are (re)rendered
    runInitial();
    window.addEventListener('gamesRendered', () => { snapshotGames(); runInitial(); });
});