document.addEventListener("DOMContentLoaded", () => {
  const positions = ["pg", "sg", "sf", "pf", "c"];
  let playerMap = {};

  const headers = {
    Authorization: "Bearer 9fa957b6-ed86-4322-8679-b35a344f21ee"
  };

  fetch("https://api.balldontlie.io/v1/players?per_page=100", { headers })
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch player data.");
      return res.json();
    })
    .then(data => {
      if (!data.data || !Array.isArray(data.data)) throw new Error("Invalid player data.");
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

      const saved = localStorage.getItem("fantasyTeam");
      if (saved) {
        const team = JSON.parse(saved);
        positions.forEach(pos => {
          const id = team[pos.toUpperCase()];
          if (id) {
            document.getElementById(pos).value = id;
          }
        });
        displayTeam(team);
      }
    })
    .catch(err => {
      console.error("Could not load players:", err);
      alert("Failed to load players. Check your API key or try again later.");
    });

  document.getElementById("fantasyForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const team = {};
    positions.forEach(pos => {
      const id = document.getElementById(pos).value;
      team[pos.toUpperCase()] = parseInt(id);
    });

    localStorage.setItem("fantasyTeam", JSON.stringify(team));
    displayTeam(team);
  });

  function displayTeam(team) {
    const teamDisplay = document.getElementById("teamDisplay");
    teamDisplay.innerHTML = "";

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
