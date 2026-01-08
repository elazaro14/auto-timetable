const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const forms = ["F1A", "F1B", "F1C", "F1D", "F1E", "F1F", "F1G", "F2A", "F2B", "F2C", "F2D", "F3A", "F3B", "F3C", "F3D", "F4A", "F4B", "F4C"];
const periods = ["P1", "P2", "P3", "P4", "BREAK", "P5", "P6", "P7", "P8", "P9"];
const times = ["8:00-8:40", "8:40-9:20", "9:20-10:00", "10:40-11:10", "10:40-11:10", "11:10-11:50", "11:50-12:30", "12:30-13:10", "13:10-13:50", "13:50-14:30"];

let subjectsData = []; // Loaded from CSV

function handleUpload() {
    const file = document.getElementById('csvFile').files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const lines = e.target.result.split('\n');
        subjectsData = [];
        lines.forEach((line, i) => {
            if (i === 0 || !line.trim()) return;
            const [subject, teacher, room, form] = line.split(',');
            subjectsData.push({ subject, teacher, room, form });
        });
        alert("Data Loaded!");
        document.getElementById('genBtn').disabled = false;
    };
    reader.readAsText(file);
}

function calculateFitness(timetable) {
    let clashes = 0;
    for (let i = 0; i < timetable.length; i++) {
        for (let j = i + 1; j < timetable.length; j++) {
            const a = timetable[i];
            const b = timetable[j];
            if (a.day === b.day && a.period === b.period) {
                if (a.teacher === b.teacher) clashes++;
                if (a.room === b.room) clashes++;
                if (a.form === b.form) clashes++; // Safety check
            }
        }
    }
    return 1 / (1 + clashes);
}

function generateRandomTimetable() {
    return subjectsData.map(item => ({
        ...item,
        day: days[Math.floor(Math.random() * days.length)],
        period: periods.filter(p => p !== "BREAK")[Math.floor(Math.random() * 9)]
    }));
}

function displayTimetable(timetable) {
    const display = document.getElementById('timetable-display');
    let html = '';

    days.forEach(day => {
        html += `<div class="day-section"><table>
            <tr class="header-row"><td rowspan="22" class="day-label">${day}</td><td>PERIOD</td>${periods.map(p=>`<td>${p}</td>`).join('')}</tr>
            <tr class="header-row"><td>TIME</td>${times.map(t=>`<td>${t}</td>`).join('')}</tr>`;

        forms.forEach(form => {
            if (["F2A", "F3A", "F4A"].includes(form)) html += `<tr class="separator"><td colspan="11"></td></tr>`;
            html += `<tr><td>${form}</td>`;
            periods.forEach(p => {
                if (p === "BREAK") {
                    html += ["F1G", "F2D", "F3D"].includes(form) ? `<td class="break-cell">TEA BREAK</td>` : `<td class="break-cell"></td>`;
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

function startEvolution() {
    let population = Array.from({ length: 30 }, generateRandomTimetable);
    let gen = 0;
    const interval = setInterval(() => {
        gen++;
        population.sort((a, b) => calculateFitness(b) - calculateFitness(a));
        document.getElementById('gen-count').innerText = gen;
        document.getElementById('best-fit').innerText = calculateFitness(population[0]).toFixed(4);
        displayTimetable(population[0]);
        if (calculateFitness(population[0]) === 1 || gen > 1000) clearInterval(interval);
        
        let nextGen = population.slice(0, 5);
        while(nextGen.length < 30) {
            let parent = nextGen[Math.floor(Math.random() * 5)];
            let child = JSON.parse(JSON.stringify(parent));
            let target = child[Math.floor(Math.random() * child.length)];
            target.day = days[Math.floor(Math.random() * days.length)];
            target.period = periods.filter(p => p !== "BREAK")[Math.floor(Math.random() * 9)];
            nextGen.push(child);
        }
        population = nextGen;
    }, 100);
}
