const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const periods = ["P1", "P2", "P3", "P4", "BREAK", "P5", "P6", "P7", "P8", "P9"];
const times = ["8:00", "8:40", "9:20", "10:00", "10:40", "11:10", "11:50", "12:30", "13:10", "13:50"];

let config = {
    schoolName: "YOUR SCHOOL NAME", academicYear: "2025/2026", logoUrl: "logo.png",
    breakLabel: "TEA BREAK",
    forms: ["F1A", "F1B", "F1C", "F1D", "F1E", "F1F", "F1G", "F2A", "F2B", "F2C", "F2D", "F3A", "F3B", "F3C", "F3D", "F4A", "F4B", "F4C"],
    fixedEvents: [
        { day: "WEDNESDAY", periods: ["P7", "P8", "P9"], label: "RELIGION" },
        { day: "FRIDAY", periods: ["P7", "P8", "P9"], label: "MOSQUE" }
    ]
};

let subjectsData = [], subjectColors = {};

function toggleSettings() {
    const p = document.getElementById('settings-panel'), o = document.getElementById('overlay');
    const open = p.style.display === 'block';
    p.style.display = open ? 'none' : 'block'; o.style.display = open ? 'none' : 'block';
    if(!open) document.getElementById('cfg-forms').value = config.forms.join(', ');
}

function saveSettings() {
    config.schoolName = document.getElementById('cfg-school-name').value;
    config.academicYear = document.getElementById('cfg-academic-year').value;
    config.logoUrl = document.getElementById('cfg-logo-url').value;
    config.breakLabel = document.getElementById('cfg-break-label').value.toUpperCase();
    config.forms = document.getElementById('cfg-forms').value.split(',').map(s => s.trim().toUpperCase());
    
    document.getElementById('display-school-name').innerText = config.schoolName.toUpperCase();
    document.getElementById('display-academic-year').innerText = "ACADEMIC YEAR: " + config.academicYear;
    document.getElementById('school-logo-img').src = config.logoUrl;
    toggleSettings();
}

function getSubjectColor(s) {
    if (!subjectColors[s]) {
        const colors = ['#e3f2fd', '#f1f8e9', '#fff3e0', '#fce4ec', '#f3e5f5', '#e0f7fa'];
        subjectColors[s] = colors[Object.keys(subjectColors).length % colors.length];
    }
    return subjectColors[s];
}

function handleUpload() {
    const file = document.getElementById('csvFile').files[0];
    const reader = new FileReader();
    reader.onload = e => {
        subjectsData = e.target.result.split('\n').slice(1).filter(l => l.trim()).map(l => {
            const [s, t, r, f] = l.split(',').map(x => x?.trim().toUpperCase());
            return { subject: s, teacher: t, room: r || "N/A", form: f };
        });
        document.getElementById('genBtn').disabled = false;
        alert("Loaded!");
    };
    reader.readAsText(file);
}

function calculateFitness(tt) {
    let c = 0;
    tt.forEach((a, i) => {
        if (config.fixedEvents.some(e => e.day === a.day && e.periods.includes(a.period))) c += 50;
        for (let j = i + 1; j < tt.length; j++) {
            const b = tt[j];
            if (a.day === b.day && a.period === b.period) {
                if (a.teacher === b.teacher || a.form === b.form || (a.room === b.room && a.room !== "N/A")) c++;
            }
        }
    });
    return 1 / (1 + c);
}

function displayTimetable(tt) {
    document.body.classList.add('show-content');
    let html = '';
    days.forEach(day => {
        html += `<div class="day-section"><table>
            <tr class="header-row"><td rowspan="25" class="day-label">${day}</td><td>PERIOD</td>${periods.map(p=>`<td>${p}</td>`).join('')}</tr>
            <tr class="header-row"><td>TIME</td>${times.map(t=>`<td>${t}</td>`).join('')}</tr>`;
        config.forms.forEach(f => {
            if (f.endsWith("A") && f !== config.forms[0]) html += `<tr class="separator"><td colspan="11"></td></tr>`;
            html += `<tr><td>${f}</td>`;
            periods.forEach(p => {
                const fixed = config.fixedEvents.find(e => e.day === day && e.periods.includes(p));
                if (p === "BREAK") html += `<td class="break-cell">${f === config.forms[Math.floor(config.forms.length/2)] ? config.breakLabel : ''}</td>`;
                else if (fixed) html += `<td style="background:#e1f5fe; font-weight:bold;">${fixed.label}</td>`;
                else {
                    const s = tt.find(x => x.day === day && x.form === f && x.period === p);
                    html += `<td style="background:${s ? getSubjectColor(s.subject) : '#fff'}">${s ? `<strong>${s.subject}</strong>${s.teacher}` : ''}</td>`;
                }
            });
            html += `</tr>`;
        });
        html += `</table></div>`;
    });
    document.getElementById('timetable-display').innerHTML = html;
}

function startEvolution() {
    const vp = periods.filter(p => p !== "BREAK");
    let pop = Array.from({ length: 40 }, () => subjectsData.map(item => ({
        ...item, day: days[Math.floor(Math.random()*5)], period: vp[Math.floor(Math.random()*9)]
    })));
    let gen = 0;
    const timer = setInterval(() => {
        gen++; pop.sort((a,b) => calculateFitness(b) - calculateFitness(a));
        const clash = Math.round((1/calculateFitness(pop[0])) - 1);
        document.getElementById('gen-count').innerText = gen;
        document.getElementById('best-fit').innerText = clash + " Clashes";
        displayTimetable(pop[0]);
        if (clash === 0 || gen > 1000) clearInterval(timer);
        let next = pop.slice(0, 10);
        while(next.length < 40) {
            let child = JSON.parse(JSON.stringify(next[Math.floor(Math.random()*10)]));
            let t = child[Math.floor(Math.random()*child.length)];
            t.day = days[Math.floor(Math.random()*5)]; t.period = vp[Math.floor(Math.random()*9)];
            next.push(child);
        }
        pop = next;
    }, 50);
}

function downloadCSVTemplate() {
    const csv = "Subject,Teacher,Room,Form\nMATHEMATICS,MR. SMITH,RM 1,F1A\nBIOLOGY,MS. JONES,LAB A,F1A";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'template.csv'; a.click();
}
