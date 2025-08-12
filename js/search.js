document.addEventListener("DOMContentLoaded", () => {
    const searchBox = document.getElementById("search-box");
    const searchButton = document.getElementById("search-button");
    const gameList = document.getElementById("game-list");
    const gamesContainer = document.getElementById("games-container");
    const games = gamesContainer.querySelectorAll(".game");
    const status = document.getElementById("results-status");

    const score = (text, q) => {
        if (!q) return 0;
        if (text === q) return 5;
        if (text.startsWith(q)) return 3;
        if (text.includes(q)) return 1;
        return 0;
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

        // Empty query restores original order
        if (!query) {
            status && (status.textContent = "Showing all games");
            // Restore original DOM order by sorting by their original index
            const original = Array.from(games);
            gamesContainer.innerHTML = "";
            original.forEach(g => gamesContainer.appendChild(g));
            return;
        }

        const results = [];
        games.forEach((game) => {
            const title = (game.dataset.title || "").toLowerCase();
            const desc = (game.querySelector("p")?.textContent || "").toLowerCase();
            const tags = (game.dataset.tags || "").toLowerCase();

            const s = score(title, query) * 3 + score(desc, query) * 2 + score(tags, query);
            if (s > 0) results.push({ element: game, s });
        });

        results.sort((a, b) => b.s - a.s);

    gamesContainer.innerHTML = "";
    results.forEach(r => gamesContainer.appendChild(r.element));

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

    // Load initial query from URL if present
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
        searchBox.value = q;
        searchGames();
    }
});