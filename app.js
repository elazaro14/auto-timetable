// --- CONFIGURATION ---
const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const periods = ["P1", "P2", "P3", "P4", "BREAK", "P5", "P6", "P7", "P8", "P9"];

const periodTimes = {
    "P1": { start: 480, end: 520 }, "P2": { start: 520, end: 560 },
    "P3": { start: 560, end: 600 }, "P4": { start: 600, end: 640 },
    "P5": { start: 670, end: 710 }, "P6": { start: 710, end: 750 },
    "P7": { start: 750, end: 790 }, "P8": { start: 790, end: 830 },
    "P9": { start: 830, end: 870 }
};

let config = {
    schoolName: "YOUR SCHOOL NAME",
    academicYear: "2025/2026",
    logoUrl: "logo.png",
    breakLabel: "TEA BREAK",
    forms: ["F1A","F1B","F1C","F1D","F1E","F1F","F1G","F2A","F2B","F2C","F2D","F3A","F3B","F3C","F3D","F4A","F4B","F4C"],
    fixedEvents: [
        { day: "WEDNESDAY", periods: ["P7", "P8", "P9"], label: "RELIGION" },
        { day: "FRIDAY", periods: ["P7", "P8", "P9"], label: "MOSQUE" }
    ]
};

let subjectsData = [];
let subjectColors = {};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('settingsBtn').onclick = toggleSettings;
    document.getElementById('saveBtn').onclick = saveSettings;
    document.getElementById('dlBtn').onclick = downloadCSVTemplate;
    document.getElementById('ulBtn').onclick = () => document.getElementById('csvFile').click();
    document.getElementById('csvFile').onchange = handleUpload;
    document.getElementById('genBtn').onclick = startEvolution;
    document.getElementById('overlay').onclick = toggleSettings;
});

// --- TEMPLATE ENGINE (PERIOD ALLOCATIONS) ---
function downloadCSVTemplate() {
    let csv = "Subject,Teacher,Room,Form,Availability\n";
    
    // F1 & F2 Allocation (37 periods)
    const f12Streams = config.forms.filter(f => f.startsWith('F1') || f.startsWith('F2'));
    const f12Subs = [
        {s: "MATHEMATICS", p: 5}, {s: "ENGLISH", p: 5}, {s: "KISWAHILI", p: 4},
        {s: "BUSINESS STUDIES", p: 3}, {s: "HISTORIA/MAADILI", p: 3}, {s: "HISTORY", p: 3},
        {s: "BOOK-KEEPING", p: 3}, {s: "PHYSICS", p: 3}, {s: "CHEMISTRY", p: 3},
        {s: "BIOLOGY", p: 3}, {s: "GEOGRAPHY", p: 2}
    ];

    // F3 & F4 Allocation (38 periods)
    const f34Streams = config.forms.filter(f => f.startsWith('F3') || f.startsWith('F4'));
    const f34Subs = [
        {s: "ENGLISH", p: 6}, {s: "MATHEMATICS", p: 5}, {s: "KISWAHILI", p: 4},
        {s: "HISTORY", p: 4}, {s: "PHYSICS", p: 4}, {s: "CHEMISTRY", p: 4},
        {s: "BIOLOGY", p: 4}, {s: "GEOGRAPHY", p: 4}, {s: "CIVICS", p: 3}
    ];

    f12Streams.forEach(f => f12Subs.forEach(sub => { for(let i=0; i<sub.p; i++) csv += `${sub.s},TEACHER_NAME,ROOM_X,${f},ALL\n`; }));
    f34Streams.forEach(f => f34Subs.forEach(sub => { for(let i=0; i<sub.p; i++) csv += `${sub.s},TEACHER_NAME,ROOM_X,${f},ALL\n`; }));

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'school_template_v2.csv'; a.click();
}

// --- AI BRAIN (CLASH DETECTION) ---
function isAvailable(lesson, avStr) {
    if (!avStr || avStr === "ALL") return true;
    const lDay = lesson.day.substring(0, 3);
    const lTime = periodTimes[lesson.period];
    if (!lTime) return true;
    const rules = avStr.split(';');
    for (let r of rules) {
        if (!r.includes(lDay)) continue;
        const match = r.match(/\((.*?)\)/);
        if (!match) return true;
        const [sStr, eStr] = match[1].split('-');
        const [sh, sm] = sStr.split(':').map(Number);
        const [eh, em] = eStr.split(':').map(Number);
        if (lTime.start >= (sh*60+sm) && lTime.end <= (eh*60+em)) return true;
    }
    return false;
}

function calculateFitness(tt) {
    let clash = 0;
    tt.forEach((a, i) => {
        if (config.fixedEvents.some(e => e.day === a.day && e.periods.includes(a.period))) clash += 100;
        if (!isAvailable(a, a.availability)) clash += 60;
        for (let j = i + 1; j < tt.length; j++) {
            const b = tt[j];
            if (a.day === b.day && a.period === b.period) {
                if (a.teacher === b.teacher || a.form === b.form || (a.room === b.room && a.room !== "N/A")) clash++;
            }
        }
    });
    return 1 / (1 + clash);
}

// --- UI GENERATION ---
function displayTimetable(tt) {
    let html = '';
    days.forEach(day => {
        html += `<div class="day-section"><table><tr class="header-row"><td rowspan="100" class="day-label">${day}</td><td>STREAM</td>${periods.map(p=>`<td>${p}</td>`).join('')}</tr>`;
        let lastPref = "";
        config.forms.forEach(f => {
            if (lastPref !== "" && f.substring(0,2) !== lastPref) html += `<tr class="separator"><td colspan="11"></td></tr>`;
            lastPref = f.substring(0,2);
            html += `<tr><td style="font-weight:bold">${f}</td>`;
            periods.forEach(p => {
                const fixed = config.fixedEvents.find(e => e.day === day && e.periods.includes(p));
                if (p === "BREAK") html += `<td class="break-cell">${f==="F2A"?config.breakLabel:""}</td>`;
                else if (fixed) html += `<td style="background:#e1f5fe">${fixed.label}</td>`;
                else {
                    const s = tt.find(x => x.day === day && x.form === f && x.period === p);
                    html += `<td style="background:${s?getSubjectColor(s.subject):'#fff'}">${s?`<strong>${s.subject}</strong>${s.teacher}`:''}</td>`;
                }
            });
            html += `</tr>`;
        });
        html += `</table></div>`;
    });
    document.getElementById('timetable-display').innerHTML = html;
}

function getSubjectColor(s) {
    if (!subjectColors[s]) {
        const colors = ['#e3f2fd','#f1f8e9','#fff3e0','#fce4ec','#f3e5f5','#e0f7fa','#e8f5e9'];
        subjectColors[s] = colors[Object.keys(subjectColors).length % colors.length];
    }
    return subjectColors[s];
}

// --- DATA HANDLING ---
function handleUpload(event) {
    const reader = new FileReader();
    reader.onload = e => {
        subjectsData = e.target.result.split('\n').slice(1).filter(l=>l.trim()).map(l=>{
            const [s,t,r,f,av] = l.split(',').map(x=>x?.trim().toUpperCase());
            return { subject:s, teacher:t, room:r, form:f, availability:av };
        });
        document.getElementById('genBtn').disabled = false;
        alert("Success! Data for 18 streams loaded.");
    };
    reader.readAsText(event.target.files[0]);
}

function startEvolution() {
    const vp = periods.filter(p=>p!=="BREAK");
    let pop = Array.from({length:30}, () => subjectsData.map(it=>({...it, day:days[Math.floor(Math.random()*5)], period:vp[Math.floor(Math.random()*9)]})));
    let gen = 0;
    const timer = setInterval(() => {
        gen++; pop.sort((a,b)=>calculateFitness(b)-calculateFitness(a));
        const clash = Math.round((1/calculateFitness(pop[0]))-1);
        document.getElementById('gen-count').innerText = gen;
        document.getElementById('best-fit').innerText = clash + " Clashes";
        if(gen%5===0) displayTimetable(pop[0]);
        if (clash===0 || gen>1200) clearInterval(timer);
        let next = pop.slice(0,8);
        while(next.length<30){
            let c = JSON.parse(JSON.stringify(next[Math.floor(Math.random()*8)]));
            let t = c[Math.floor(Math.random()*c.length)];
            t.day=days[Math.floor(Math.random()*5)]; t.period=vp[Math.floor(Math.random()*9)];
            next.push(c);
        }
        pop = next;
    }, 40);
}

function toggleSettings() { 
    const s = document.getElementById('settings-panel').style;
    const o = document.getElementById('overlay').style;
    s.display = s.display === 'block' ? 'none' : 'block';
    o.display = o.display === 'block' ? 'none' : 'block';
}

function saveSettings() {
    config.schoolName = document.getElementById('cfg-school-name').value;
    config.academicYear = document.getElementById('cfg-academic-year').value;
    config.logoUrl = document.getElementById('cfg-logo-url').value;
    config.breakLabel = document.getElementById('cfg-break-label').value.toUpperCase();
    config.forms = document.getElementById('cfg-forms').value.split(',').map(s=>s.trim().toUpperCase());
    document.getElementById('display-school-name').innerText = config.schoolName;
    document.getElementById('display-academic-year').innerText = "ACADEMIC YEAR: " + config.academicYear;
    toggleSettings();
}
