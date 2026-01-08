// --- DYNAMIC CONFIGURATION ---
let config = {
    breakLabel: "TEA BREAK",
    forms: ["F1A", "F1B", "F1C", "F1D", "F1E", "F1F", "F1G", "F2A", "F2B", "F2C", "F2D", "F3A", "F3B", "F3C", "F3D", "F4A", "F4B", "F4C"],
    fixedEvents: [
        { day: "WEDNESDAY", periods: ["P7", "P8", "P9"], label: "RELIGION" },
        { day: "FRIDAY", periods: ["P7", "P8", "P9"], label: "MOSQUE" }
    ]
};

// Toggle Settings UI
function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    document.getElementById('cfg-forms').value = config.forms.join(', ');
}

// Save Settings to Logic
function saveSettings() {
    config.breakLabel = document.getElementById('cfg-break-label').value;
    config.forms = document.getElementById('cfg-forms').value.split(',').map(s => s.trim());
    document.getElementById('settings-panel').style.display = 'none';
    alert("Settings Updated!");
}

// --- UPDATE THE DISPLAY FUNCTION TO USE CONFIG ---
function displayTimetable(timetable) {
    const display = document.getElementById('timetable-display');
    let html = '';

    days.forEach(day => {
        html += `<div class="day-section"><table>
            <tr class="header-row"><td rowspan="25" class="day-label">${day}</td><td>PERIOD</td>${periods.map(p=>`<td>${p}</td>`).join('')}</tr>
            <tr class="header-row"><td>TIME</td>${times.map(t=>`<td>${t}</td>`).join('')}</tr>`;

        config.forms.forEach(form => {
            // Updated separators to use the config list
            if (form.endsWith("A") && form !== config.forms[0]) {
                html += `<tr class="separator"><td colspan="${periods.length + 1}"></td></tr>`;
            }

            html += `<tr><td>${form}</td>`;
            
            periods.forEach(p => {
                const fixed = config.fixedEvents.find(e => e.day === day && e.periods.includes(p));
                
                if (p === "BREAK") {
                    // Show tea break label only on specific rows for clean look
                    const showText = form === config.forms[Math.floor(config.forms.length/2)];
                    html += `<td class="break-cell">${showText ? config.breakLabel : ''}</td>`;
                } else if (fixed) {
                    html += `<td style="background:#e1f5fe; font-weight:bold; color:#01579b;">${fixed.label}</td>`;
                } else {
                    const session = timetable.find(c => c.day === day && c.form === form && c.period === p);
                    html += `<td class="class-cell">${session ? `<strong>${session.subject}</strong>${session.teacher}` : ''}</td>`;
                }
            });
            html += `</tr>`;
        });
        html += `</table></div>`;
    });
    display.innerHTML = html;
}

// (The rest of your app.js evolution code stays the same)
