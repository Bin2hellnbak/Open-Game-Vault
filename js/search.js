document.addEventListener("DOMContentLoaded", () => {
    const searchBox = document.getElementById("search-box");
    const searchButton = document.getElementById("search-button");
    const gameList = document.getElementById("game-list");
    const games = document.querySelectorAll(".game");

    const searchGames = () => {
        const query = searchBox.value.toLowerCase();
        const results = [];

        games.forEach((game) => {
            const title = game.dataset.title.toLowerCase();
            const relevance = title.includes(query) ? 1 : 0;

            if (relevance > 0) {
                results.push({ element: game, relevance });
            }
        });

        // Sort results by relevance (descending)
        results.sort((a, b) => b.relevance - a.relevance);

        // Clear the game list and append results
        gameList.innerHTML = "";
        results.forEach((result) => {
            gameList.appendChild(result.element);
        });

        // If no results, show a message
        if (results.length === 0) {
            gameList.innerHTML = "<p>No games found.</p>";
        }
    };

    // Add event listeners
    searchButton.addEventListener("click", searchGames);
    searchBox.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            searchGames();
        }
    });
});