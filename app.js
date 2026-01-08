const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const periods = ["P1", "P2", "P3", "P4", "BREAK", "P5", "P6", "P7", "P8", "P9"];
const periodTimes = {
    "P1": {s: 480, e: 520}, "P2": {s: 520, e: 560}, "P3": {s: 560, e: 600}, "P4": {s: 600, e: 640},
    "P5": {s: 670, e: 710}, "P6": {s: 710, e: 750}, "P7": {s: 750, e: 790}, "P8": {s: 790, e: 830}, "P9": {s: 830, e: 870}
};

let config = {
    schoolName: "YOUR SCHOOL NAME", academicYear: "2025/2026", breakLabel: "TEA BREAK",
    forms: ["F1A","F1B","F1C","F1D","F1E","F1F","F1G","F2A","F2B","F2C","F2D","F3A","F3B","F3C","F3D","F4A","F4B","F4C"],
    fixedEvents: [{day: "WEDNESDAY", periods: ["P7","P8","P9"], label: "RELIGION"}, {day: "FRIDAY", periods: ["P7","P8","P9"], label: "MOSQUE"}]
};

let subjectsData = [], subjectColors = {};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('settingsBtn').onclick = toggleSettings;
    document.getElementById('saveBtn').onclick = saveSettings;
    document.getElementById('dlBtn').onclick = downloadCSVTemplate;
    document.getElementById('ulBtn').onclick = () => document.getElementById('csvFile').click();
    document.getElementById('csvFile').onchange = handleUpload;
    document.getElementById('genBtn').onclick = startEvolution;
});

// --- DOUBLE PERIOD PRIORITY ENGINE ---
function isDouble(a, b) {
    if (a.subject !== b.subject || a.teacher !== b.teacher || a.form !== b.form || a.day !== b.day) return false;
    const p1 = parseInt(a.period.replace('P','')), p2 = parseInt(b.period.replace('P',''));
    return Math.abs(p1 - p2) === 1; // Adjacent periods
}

function calculateFitness(tt) {
    let clash = 0, doubleBonus = 0;
    tt.forEach((a, i) => {
        if (config.fixedEvents.some(e => e.day === a.day && e.periods.includes(a.period))) clash += 100;
        for (let j = i + 1; j < tt.length; j++) {
            const b = tt[j];
            if (a.day === b.day && a.period === b.period) {
                if (a.teacher === b.teacher || a.form === b.form || (a.room === b.room && a.room !== "N/A")) clash++;
            }
            if (isDouble(a, b)) doubleBonus += 5; // Reward double periods
        }
    });
    return (1 + doubleBonus) / (1 + clash);
}

function downloadCSVTemplate() {
    let csv = "Subject,Teacher,Room,Form,Availability\n";
    const f12 = config.forms.filter(f => f.startsWith('F1') || f.startsWith('F2'));
    const f12S = [{s:"MATHEMATICS",p:5},{s:"ENGLISH",p:5},{s:"KISWAHILI",p:4},{s:"PHYSICS",p:3},{s:"CHEMISTRY",p:3},{s:"BIOLOGY",p:3}];
    const f34 = config.forms.filter(f => f.startsWith('F3') || f.startsWith('F4'));
    const f34S = [{s:"ENGLISH",p:6},{s:"MATHEMATICS",p:5},{s:"KISWAHILI",p:4},{s:"PHYSICS",p:4},{s:"CHEMISTRY",p:4},{s:"BIOLOGY",p:4}];

    f12.forEach(f => f12S.forEach(sub => { for(let i=0; i<sub.p; i++) csv += `${sub.s},TEACHER_NAME,ROOM_X,${f},ALL\n`; }));
    f34.forEach(f => f34S.forEach(sub => { for(let i=0; i<sub.p; i++) csv += `${sub.s},TEACHER_NAME,ROOM_X,${f},ALL\n`; }));
    
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'timetable_template.csv'; a.click();
}

function displayTimetable(tt) {
    let html = '';
    days.forEach(day => {
        html += `<div class="day-section"><table><tr class="header-row"><td rowspan="100" class="day-label">${day}</td><td>STREAM</td>${periods.map(p=>`<td>${p}</td>`).join('')}</tr>`;
        let lastPref = "";
        config.forms.forEach(f => {
            if (lastPref !== "" && f.substring(0,2) !== lastPref) html += `<tr class="separator"><td colspan="11"></td></tr>`;
            lastPref = f.substring(0,2);
            html += `<tr><td><strong>${f}</strong></td>`;
            periods.forEach(p => {
                if (p === "BREAK") html += `<td class="break-cell">${f.includes("A")?config.breakLabel:""}</td>`;
                else {
                    const s = tt.find(x => x.day === day && x.form === f && x.period === p);
                    html += `<td style="background:${s?getSubjectColor(s.subject):'#fff'}">${s?`<b>${s.subject}</b><br>${s.teacher}`:''}</td>`;
                }
            });
            html += `</tr>`;
        });
        html += `</table></div>`;
    });
    document.getElementById('timetable-display').innerHTML = html;
}

// ... (Keep existing handleUpload, getSubjectColor, toggleSettings, saveSettings) ...

function startEvolution() {
    const vp = periods.filter(p=>p!=="BREAK");
    let pop = Array.from({length:40}, () => subjectsData.map(it=>({...it, day:days[Math.floor(Math.random()*5)], period:vp[Math.floor(Math.random()*9)]})));
    let gen = 0;
    const timer = setInterval(() => {
        gen++; pop.sort((a,b)=>calculateFitness(b)-calculateFitness(a));
        const score = calculateFitness(pop[0]);
        document.getElementById('gen-count').innerText = gen;
        document.getElementById('best-fit').innerText = "Optimizing...";
        if(gen%10===0) displayTimetable(pop[0]);
        if (gen > 1000) { 
            clearInterval(timer); 
            displayTimetable(pop[0]);
            generateWorkloadSummary(pop[0]);
        }
        let next = pop.slice(0,10);
        while(next.length<40){
            let c = JSON.parse(JSON.stringify(next[Math.floor(Math.random()*10)]));
            let t = c[Math.floor(Math.random()*c.length)];
            t.day=days[Math.floor(Math.random()*5)]; t.period=vp[Math.floor(Math.random()*9)];
            next.push(c);
        }
        pop = next;
    }, 30);
}

function generateWorkloadSummary(tt) {
    const w = {}; let doubles = 0;
    tt.forEach(l => { 
        if(!w[l.teacher]) w[l.teacher] = 0; w[l.teacher]++;
    });
    for(let i=0; i<tt.length; i++) for(let j=i+1; j<tt.length; j++) if(isDouble(tt[i], tt[j])) doubles++;

    const tbody = document.getElementById('workload-body');
    tbody.innerHTML = `<tr><td colspan="4" style="background:#fff3e0; font-weight:bold;">Total Double Periods Found: ${doubles}</td></tr>`;
    Object.entries(w).forEach(([name, count]) => {
        tbody.innerHTML += `<tr><td>${name}</td><td>${count}</td><td>-</td><td>✅ OK</td></tr>`;
    });
    document.getElementById('summary-panel').style.display = 'block';
}

function getSubjectColor(s) {
    if (!subjectColors[s]) {
        const colors = ['#e3f2fd','#f1f8e9','#fff3e0','#fce4ec','#f3e5f5','#e0f7fa','#fff9c4'];
        subjectColors[s] = colors[Object.keys(subjectColors).length % colors.length];
    }
    return subjectColors[s];
}
