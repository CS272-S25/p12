document.addEventListener("DOMContentLoaded", () => {
  const positions = ["pg", "sg", "sf", "pf", "c"];
  const season = 2023;
  const proxy = "https://corsproxy.io/?";
  const baseUrl = "https://www.balldontlie.io/api/v1";

  let playerMap = {}; // { playerId: fullName }

  // Fetch first 100 players
  fetch(`${proxy}${baseUrl}/players?per_page=100`)
    .then(res => res.json())
    .then(data => {
      const players = data.data;
      playerMap = Object.fromEntries(
        players.map(p => [p.id, `${p.first_name} ${p.last_name}`])
      );

      positions.forEach(pos => {
        const select = document.getElementById(pos);
        select.innerHTML = "";

        const defaultOpt = document.createElement("option");
        defaultOpt.disabled = true;
        defaultOpt.selected = true;
        defaultOpt.textContent = "Select a player";
        select.appendChild(defaultOpt);

        players.forEach(player => {
          const opt = document.createElement("option");
          opt.value = player.id;
          opt.textContent = `${player.first_name} ${player.last_name}`;
          select.appendChild(opt);
        });
      });

      // Load saved team once player data is ready
      const saved = localStorage.getItem("fantasyTeam");
      if (saved) {
        const team = JSON.parse(saved);
        positions.forEach(pos => {
          const id = team[pos.toUpperCase()];
          if (id) {
            document.getElementById(pos).value = id;
          }
        });
        displayTeamWithStats(team);
      }
    })
    .catch(err => {
      console.error("Could not load players:", err);
      alert("Failed to load player list. Please try again later.");
    });

  document.getElementById("fantasyForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const team = {};
    positions.forEach(pos => {
      const id = document.getElementById(pos).value;
      team[pos.toUpperCase()] = parseInt(id);
    });

    localStorage.setItem("fantasyTeam", JSON.stringify(team));

    displayTeamWithStats(team);
  });

  async function displayTeamWithStats(team) {
    const playerIds = Object.values(team);
    const query = playerIds.map(id => `player_ids[]=${id}`).join("&");
    const url = `${proxy}${baseUrl}/season_averages?season=${season}&${query}`;

    const res = await fetch(url);
    const data = await res.json();
    const statsList = data.data;

    const teamDisplay = document.getElementById("teamDisplay");
    const totalScoreEl = document.getElementById("totalScore");
    teamDisplay.innerHTML = "";
    totalScoreEl.textContent = "";

    let totalScore = 0;

    for (const pos in team) {
      const playerId = team[pos];
      const stats = statsList.find(p => p.player_id === playerId);
      const name = playerMap[playerId] || "Unknown Player";

      let points = 0;
      if (stats) {
        points =
          stats.pts +
          stats.reb * 1.2 +
          stats.ast * 1.5 +
          stats.stl * 3 +
          stats.blk * 3 -
          stats.turnover;

        totalScore += points;
      }

      const card = document.createElement("div");
      card.className = "col-md-4";

      card.innerHTML = `
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">${pos} - ${name}</h5>
            ${
              stats
                ? `
              <p class="card-text">
                PTS: ${stats.pts} | REB: ${stats.reb} | AST: ${stats.ast}<br>
                STL: ${stats.stl} | BLK: ${stats.blk} | TO: ${stats.turnover}<br>
                <strong>Fantasy Points:</strong> ${points.toFixed(1)}
              </p>`
                : `<p class="text-muted">No stats available</p>`
            }
          </div>
        </div>
      `;

      teamDisplay.appendChild(card);
    }

    totalScoreEl.textContent = `Total Team Fantasy Score: ${totalScore.toFixed(1)}`;
  }
});
