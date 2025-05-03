const TEAM_LOGOS = getNBALogos();
(async function() {
    const season = 2024;
    const headers = {
      "Authorization": "0ce7311f-5005-422f-add7-367816705f31",
      "Content-Type": "application/json"
    };
    const container = document.getElementById('standings-container');
    if (!container) {
      console.error('Missing #standings-container');
      return;
    }
    //Prepare fetch parameters
    function getWeeklyRanges(startStr, endStr) {
      const ranges = [];
      let cur = new Date(startStr);
      const end = new Date(endStr);
      while (cur <= end) {
        const weekStart = new Date(cur);
        const weekEnd   = new Date(cur);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > end) weekEnd.setTime(end);
        ranges.push({
          start: weekStart.toISOString().slice(0,10),
          end:   weekEnd.toISOString().slice(0,10)
        });
        cur.setDate(cur.getDate() + 7);
      }
      return ranges;
    }

    //fetch with date ranges to speed up fetch time
    async function fetchGamesInRange(start, end) {
      const all = [];
      let cursor = null;
      do {
        const url = new URL("https://api.balldontlie.io/v1/games");
        url.searchParams.set("start_date",  start);
        url.searchParams.set("end_date",    end);
        url.searchParams.set("per_page",    "100");
        url.searchParams.set("postseason",  "false");
        if (cursor) url.searchParams.set("cursor", cursor);

        const resp = await fetch(url, {
          method: "GET",
          credentials: "include",
          withCredentials: true,
          headers
        });
        if (!resp.ok) throw new Error(`Games ${start}→${end} failed: ${resp.status}`);
        const json = await resp.json();
        all.push(...json.data);
        cursor = json.meta.next_cursor;
      } while (cursor);
      return all;
    }

    async function fetchAllRegularSeasonGames() {
      const seasonStarts = "2024-10-22";
      const seasonEnds   = "2025-04-13";
      const ranges = getWeeklyRanges(seasonStarts, seasonEnds);
      const chunks = await Promise.all(
        ranges.map(r => fetchGamesInRange(r.start, r.end))
      );
      return chunks.flat();
    }

    async function fetchTeamsMap() {
      const resp = await fetch("https://api.balldontlie.io/v1/teams", {
        method: "GET",
        credentials: "include",
        withCredentials: true,
        headers
      });
      if (!resp.ok) throw new Error(`Teams fetch failed: ${resp.status}`);
      const json = await resp.json();
      const map = {};
      json.data.forEach(t => {
        if (t.conference == 'East' || t.conference == 'West') {
            map[t.id] = {
                id: t.id,
                full_name: t.full_name,
                short_name: t.full_name.split(' ').pop().toLowerCase(),
                conference: (t.conference || '').trim(),
                wins: 0,
                losses: 0,
                pf: 0,
                pa: 0
              };
        }
        
      });
      return map;
    }

    //manually build standings from all games played
    try {
      const standingsMap = await fetchTeamsMap();
      const games = await fetchAllRegularSeasonGames();

      games.forEach(game => {
        const home = game.home_team, away = game.visitor_team;
        const winner = game.home_team_score > game.visitor_team_score ? home : away;
        const loser  = game.home_team_score > game.visitor_team_score ? away : home;
        standingsMap[winner.id].wins++;
        standingsMap[loser.id].losses++;
        standingsMap[home.id].pf += parseInt(game.home_team_score)
        standingsMap[home.id].pa += parseInt(game.visitor_team_score)
        standingsMap[away.id].pf += parseInt(game.visitor_team_score)
        standingsMap[away.id].pa += parseInt(game.home_team_score)
    
      });

      const byConf = { East: [], West: [] };
      Object.values(standingsMap).forEach(team => {
        if (team.conference === 'East' || team.conference === 'West') {
          byConf[team.conference].push(team);
        }
      });
      ['East','West'].forEach(conf => {
        byConf[conf].sort((a,b) => {
          const pa = a.wins/(a.wins+a.losses);
          const pb = b.wins/(b.wins+b.losses);
          return pb - pa;
        });
      });
      //Display team data
      container.textContent = '';
      Object.entries(byConf).forEach(([conf, teams]) => {
        const section = document.createElement('section');
        section.className = 'conference';

        const h2 = document.createElement('h2');
        h2.textContent = `${conf}ern Conference`;
        section.appendChild(h2);

        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive';

        const table = document.createElement('table');
        table.className = 'table table-striped table-hover align-middle mb-0';

        // header
        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        [' ','Team','W','L','PCT','PPG','OPPG'].forEach(txt => {
          const th = document.createElement('th');
          th.textContent = txt;
          headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        teams.forEach(t => {
          const tr = document.createElement('tr');

          const imageTd = document.createElement('td')
          const img = document.createElement('img')
          img.src = TEAM_LOGOS[t.full_name]
          console.log(t.full_name + ' LOGO')
          img.alt = t.full_name + ' logo';
          img.style.width = '50px'
          imageTd.appendChild(img)
          tr.appendChild(imageTd)
          const tdName = document.createElement('td');
          tdName.textContent = t.full_name;
          tr.appendChild(tdName);

          const tdW = document.createElement('td');
          tdW.textContent = t.wins;
          tr.appendChild(tdW);

          const tdL = document.createElement('td');
          tdL.textContent = t.losses;
          tr.appendChild(tdL);

          const tdPct = document.createElement('td');
          tdPct.className = 'pct';
          tdPct.textContent = (t.wins/(t.wins+t.losses)).toFixed(3);
          tr.appendChild(tdPct);

          const tdPPG = document.createElement('td')
          tdPPG.innerText = (t.pf / (t.wins + t.losses)).toFixed(1)
          tr.appendChild(tdPPG)

          const tdOPPG = document.createElement('td')
          tdOPPG.innerText = (t.pa / (t.wins + t.losses)).toFixed(1)
          tr.appendChild(tdOPPG)

          tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        wrapper.appendChild(table);
        section.appendChild(wrapper);
        container.appendChild(section);
      });
    } catch (err) {
      console.error(err);
      const msg = document.createElement('p');
      msg.textContent = 'Failed to load standings. See console for details.';
      container.appendChild(msg);
    }
  })();