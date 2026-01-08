const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const forms = ["F1A", "F1B", "F1C", "F1D", "F1E", "F1F", "F1G", "F2A", "F2B", "F2C", "F2D", "F3A", "F3B", "F3C", "F3D", "F4A", "F4B", "F4C"];
const periods = ["P1", "P2", "P3", "P4", "BREAK", "P5", "P6", "P7", "P8", "P9"];
const times = ["8:00-8:40", "8:40-9:20", "9:20-10:00", "10:00-10:40", "10:40-11:10", "11:10-11:50", "11:50-12:30", "12:30-13:10", "13:10-13:50", "13:50-14:30"];

function displayTimetable(timetable) {
    const display = document.getElementById('timetable-display');
    let html = '';

    days.forEach(day => {
        html += `
            <div class="day-section">
                <table>
                    <tr class="header-row">
                        <td rowspan="2" class="day-label">${day}</td>
                        <td>PERIOD</td>
                        ${periods.map(p => `<td>${p}</td>`).join('')}
                    </tr>
                    <tr class="header-row">
                        <td>TIME</td>
                        ${times.map(t => `<td>${t}</td>`).join('')}
                    </tr>
        `;

        forms.forEach((form) => {
            // Add yellow separator for Form groups
            if (form === "F2A" || form === "F3A" || form === "F4A") {
                html += `<tr class="separator"><td colspan="12"></td></tr>`;
            }

            html += `<tr><td>${form}</td>`;

            periods.forEach((p, index) => {
                if (p === "BREAK") {
                    // Vertical "TEA BREAK" text like your image
                    html += (form === "F1G" || form === "F2D" || form === "F3D") 
                        ? `<td class="break-cell">TEA BREAK</td>` 
                        : `<td class="break-cell"></td>`;
                } else {
                    // Filter timetable data for specific Day, Form, and Period
                    const session = timetable.find(c => c.day === day && c.form === form && c.period === p);
                    html += `<td class="class-cell">${session ? `<strong>${session.subject}</strong><br>${session.teacher}` : ''}</td>`;
                }
            });
            html += `</tr>`;
        });

        html += `</table></div><div class="page-break"></div>`;
    });

    display.innerHTML = html;
}
