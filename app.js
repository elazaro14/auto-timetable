const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const periods = ["P1", "P2", "P3", "P4", "BREAK", "P5", "P6", "P7", "P8", "P9"];
const times = ["8:00", "8:40", "9:20", "10:00", "10:40", "11:10", "11:50", "12:30", "13:10", "13:50"];

let config = {
    breakLabel: "TEA BREAK",
    forms: ["F1A", "F1B", "F1C", "F1D", "F1E", "F1F", "F1G", "F2A", "F2B", "F2C", "F2D", "F3A", "F3B", "F3C", "F3D", "F4A", "F4B", "F4C"],
    fixedEvents: [
        { day: "WEDNESDAY", periods: ["P7", "P8", "P9"], label: "RELIGION" },
        { day: "FRIDAY", periods: ["P7", "P8", "P9"], label: "MOSQUE" }
    ]
};

let subjectsData = [];
let subjectColors = {};

// --- SETTINGS CONTROLS ---
function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    const overlay = document.getElementById('overlay');
    const isOpen = panel.style.display === 'block';
    
    panel.style.display = isOpen ? 'none' : 'block';
    overlay.style.display = isOpen ? 'none' : 'block';
    
    if (!isOpen) {
        document.getElementById('cfg-forms').value = config.forms.join(', ');
    }
}

function saveSettings() {
    const fInput = document.getElementById('cfg-forms').value;
    if (fInput) {
        config.forms = fInput.split(',').map(s => s.trim().toUpperCase());
        config.breakLabel = document.getElementById('cfg-break-label').value.toUpperCase();
        alert("Configuration updated!");
        toggleSettings();
        displayTimetable([]); // Refresh empty table view
    }
}

// --- DATA HANDLING ---
function getSubjectColor(subject) {
    if (!subjectColors[subject]) {
        const colors = ['#e3f2fd', '#f1f8e9', '#fff3e0', '#fce4ec', '#f3e5f5', '#e0f7fa', '#fff9c4'];
        subjectColors[subject] = colors[Object.keys(subjectColors).length % colors.length];
    }
    return subjectColors[subject];
}

function downloadCSVTemplate() {
    let csv = "Subject,Teacher,Room,Form\nMATHEMATICS,MR. SMITH,RM 1,F1A\nBIOLOGY,MS. JONES,LAB A,F1A\nPHYSICS,DR. BROWN,RM 2,F1B";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'school_template.csv'; a.click();
}

function handleUpload() {
    const file = document.getElementById('csvFile').files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const lines = e.target.result.split('\n');
        subjectsData = [];
        lines.forEach((line, i) => {
            if (i === 0 || !line.trim()) return;
            const [s, t, r, f] = line.split(',').map(x => x?.trim().toUpperCase());
            if(s && t && f) subjectsData.push({ subject: s, teacher: t, room: r || "N/A", form: f });
        });
        alert(`Loaded ${subjectsData.length} lessons. Ready to generate!`);
        document.getElementById('genBtn').disabled = false;
    };
    reader.readAsText(file);
}

// --- AI ENGINE ---
function calculateFitness(timetable) {
    let clashes = 0;
    timetable.forEach((a, i) => {
        // Penalty for scheduling during Religion/Mosque
        if (config.fixedEvents.some(e => e.day === a.day && e.periods.includes(a.period))) clashes += 50;
        
        for (let j = i + 1; j < timetable.length; j++) {
            const b = timetable[j];
            if (a.day === b.day && a.period === b.period) {
                if (a.teacher === b.teacher) clashes++; 
                if (a.form === b.form) clashes++;
                if (a.room === b.room && a.room !== "N/A") clashes++;
            }
        }
    });
    return 1 / (1 + clashes);
}

function displayTimetable(timetable) {
    const display = document.getElementById('timetable-display');
    let html = '';
    days.forEach(day => {
        html += `<div class="day-section"><table>
            <tr class="header-row"><td rowspan="25" class="day-label">${day}</td><td>PERIOD</td>${periods.map(p=>`<td>${p}</td>`).join('')}</tr>
            <tr class="header-row"><td>TIME</td>${times.map(t=>`<td>${t}</td>`).join('')}</tr>`;
        
        config.forms.forEach(form => {
            if (form.endsWith("A") && form !== config.forms[0]) 
                html += `<tr class="separator"><td colspan="11"></td></tr>`;
            
            html += `<tr><td>${form}</td>`;
            periods.forEach(p => {
                const fixed = config.fixedEvents.find(e => e.day === day && e.periods.includes(p));
                if (p === "BREAK") {
                    const mid = config.forms[Math.floor(config.forms.length/2)];
                    html += `<td class="break-cell">${form === mid ? config.breakLabel : ''}</td>`;
                } else if (fixed) {
                    html += `<td style="background:#e1f5fe; font-weight:bold;">${fixed.label}</td>`;
                } else {
                    const s = timetable.find(c => c.day === day && c.form === form && c.period === p);
                    const color = s ? getSubjectColor(s.subject) : '#fff';
                    html += `<td style="background:${color}">${s ? `<strong>${s.subject}</strong>${s.teacher}` : ''}</td>`;
                }
            });
            html += `</tr>`;
        });
        html += `</table></div>`;
    });
    display.innerHTML = html;
}

function startEvolution() {
    const validPeriods = periods.filter(p => p !== "BREAK");
    let pop = Array.from({ length: 40 }, () => subjectsData.map(item => ({
        ...item, day: days[Math.floor(Math.random()*5)], period: validPeriods[Math.floor(Math.random()*9)]
    })));
    
    let gen = 0;
    const timer = setInterval(() => {
        gen++;
        pop.sort((a,b) => calculateFitness(b) - calculateFitness(a));
        const best = pop[0];
        const clashCount = Math.round((1/calculateFitness(best)) - 1);
        
        document.getElementById('gen-count').innerText = gen;
        document.getElementById('best-fit').innerText = clashCount + " Clashes remaining";
        
        displayTimetable(best);
        if (clashCount === 0 || gen > 1200) {
            clearInterval(timer);
            if(clashCount === 0) alert("SUCCESS: Zero clashes found!");
        }

        let next = pop.slice(0, 10);
        while(next.length < 40) {
            let child = JSON.parse(JSON.stringify(next[Math.floor(Math.random()*10)]));
            let t = child[Math.floor(Math.random()*child.length)];
            t.day = days[Math.floor(Math.random()*5)];
            t.period = validPeriods[Math.floor(Math.random()*9)];
            next.push(child);
        }
        pop = next;
    }, 50);
}
