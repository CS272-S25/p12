document.addEventListener("DOMContentLoaded", () => {
  const positions = ["pg", "sg", "sf", "pf", "c"];
  const season = 2023;
  let playerMap = {};

  // Load first 100 players
  fetch("https://www.balldontlie.io/api/v1/players?per_page=100")
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

      // Restore saved team
      const saved = localStorage.getItem("fantasyTeam");
      if (saved) {
        const team = JSON.parse(saved);
        positions.forEach(pos => {
          const id = team[pos.toUpperCase()];
          if (id) {
            document.getElementById(pos).value = id;
          }
        });
        displayTeamOnly(team);
      }
    });

  document.getElementById("fantasyForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const team = {};
    positions.forEach(pos => {
      const id = document.getElementById(pos).value;
      team[pos.toUpperCase()] = parseInt(id);
    });

    localStorage.setItem("fantasyTeam", JSON.stringify(team));
    displayTeamOnly(team);
  });

  function displayTeamOnly(team) {
    const teamDisplay = document.getElementById("teamDisplay");
    const totalScoreEl = document.getElementById("totalScore");
    teamDisplay.innerHTML = "";
    totalScoreEl.textContent = "";

    for (const pos in team) {
      const playerId = team[pos];
      const name = playerMap[playerId] || "Unknown Player";

      const card = document.createElement("div");
      card.className = "col-md-4";

      card.innerHTML = `
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">${pos}</h5>
            <p class="card-text">${name}</p>
          </div>
        </div>
      `;

      teamDisplay.appendChild(card);
    }
  }
});
