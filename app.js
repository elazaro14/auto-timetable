// --- 1. FORCE BUTTON CONNECTION ---
window.onload = function() {
    console.log("System Loading...");
    
    // Connect Settings
    const settingsBtn = document.getElementById('settingsBtn');
    if(settingsBtn) settingsBtn.onclick = toggleSettings;

    // Connect Save
    const saveBtn = document.getElementById('saveBtn');
    if(saveBtn) saveBtn.onclick = saveSettings;

    // Connect Download
    const dlBtn = document.getElementById('dlBtn');
    if(dlBtn) dlBtn.onclick = downloadCSVTemplate;

    // Connect Upload
    const ulBtn = document.getElementById('ulBtn');
    const fileInput = document.getElementById('csvFile');
    if(ulBtn && fileInput) {
        ulBtn.onclick = () => fileInput.click();
        fileInput.onchange = handleUpload;
    }

    // Connect Generate
    const genBtn = document.getElementById('genBtn');
    if(genBtn) genBtn.onclick = startEvolution;

    console.log("All buttons connected.");
};

// --- 2. CONFIGURATION & CORE DATA ---
const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const periods = ["P1", "P2", "P3", "P4", "BREAK", "P5", "P6", "P7", "P8", "P9"];

let config = {
    schoolName: "YOUR SCHOOL NAME",
    academicYear: "2025/2026",
    breakLabel: "TEA BREAK",
    forms: ["F1A","F1B","F1C","F1D","F1E","F1F","F1G","F2A","F2B","F2C","F2D","F3A","F3B","F3C","F3D","F4A","F4B","F4C"],
    fixedEvents: [
        {day: "WEDNESDAY", periods: ["P7","P8","P9"], label: "RELIGION"}, 
        {day: "FRIDAY", periods: ["P7","P8","P9"], label: "MOSQUE"}
    ]
};

let subjectsData = [];
let subjectColors = {};

// --- 3. DOWNLOAD TEMPLATE (WITH TANZANIA PERIOD ALLOCATION) ---
function downloadCSVTemplate() {
    let csv = "Subject,Teacher,Room,Form,Availability\n";
    
    const f12 = config.forms.filter(f => f.startsWith('F1') || f.startsWith('F2'));
    const f12S = [
        {s:"MATHEMATICS",p:5},{s:"ENGLISH",p:5},{s:"KISWAHILI",p:4},
        {s:"PHYSICS",p:3},{s:"CHEMISTRY",p:3},{s:"BIOLOGY",p:3}
    ];

    const f34 = config.forms.filter(f => f.startsWith('F3') || f.startsWith('F4'));
    const f34S = [
        {s:"ENGLISH",p:6},{s:"MATHEMATICS",p:5},{s:"KISWAHILI",p:4},
        {s:"PHYSICS",p:4},{s:"CHEMISTRY",p:4},{s:"BIOLOGY",p:4}
    ];

    f12.forEach(f => f12S.forEach(sub => { for(let i=0; i<sub.p; i++) csv += `${sub.s},TEACHER_NAME,ROOM_X,${f},ALL\n`; }));
    f34.forEach(f => f34S.forEach(sub => { for(let i=0; i<sub.p; i++) csv += `${sub.s},TEACHER_NAME,ROOM_X,${f},ALL\n`; }));
    
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timetable_template.csv';
    a.click();
}

// --- 4. DATA HANDLING ---
function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        subjectsData = e.target.result.split('\n').slice(1).filter(l=>l.trim()).map(l=>{
            const [s,t,r,f,av] = l.split(',').map(x=>x?.trim().toUpperCase());
            return { subject:s, teacher:t, room:r, form:f, availability:av || "ALL" };
        });
        document.getElementById('genBtn').disabled = false;
        alert("Data for 18 streams loaded! Ready to generate.");
    };
    reader.readAsText(file);
}

// --- 5. DOUBLE PERIOD & FITNESS LOGIC ---
function isDouble(a, b) {
    if (a.subject !== b.subject || a.teacher !== b.teacher || a.form !== b.form || a.day !== b.day) return false;
    const p1 = parseInt(a.period.replace('P','')), p2 = parseInt(b.period.replace('P',''));
    return Math.abs(p1 - p2) === 1; 
}

function calculateFitness(tt) {
    let clash = 0, doubleBonus = 0;
    tt.forEach((a, i) => {
        if (config.fixedEvents.some(e => e.day === a.day && e.periods.includes(a.period))) clash += 100;
        for (let j = i + 1; j < tt.length; j++) {
            const b = tt[j];
            if (a.day === b.day && a.period === b.period) {
                if (a.teacher === b.teacher || a.form === b.form) clash += 10;
            }
            if (isDouble(a, b)) doubleBonus += 10; // High priority for Double Periods
        }
    });
    return (1 + doubleBonus) / (1 + clash);
}

// --- 6. SETTINGS & UI ---
function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    const overlay = document.getElementById('overlay');
    const isHidden = panel.style.display === 'none' || panel.style.display === '';
    panel.style.display = isHidden ? 'block' : 'none';
    overlay.style.display = isHidden ? 'block' : 'none';
}

function saveSettings() {
    config.schoolName = document.getElementById('cfg-school-name').value;
    config.academicYear = document.getElementById('cfg-academic-year').value;
    document.getElementById('display-school-name').innerText = config.schoolName;
    toggleSettings();
}

// --- 7. EVOLUTION & DISPLAY (Abbreviated for brevity, keep your previous versions of these) ---
function startEvolution() {
    const vp = periods.filter(p=>p!=="BREAK");
    let pop = Array.from({length:20}, () => subjectsData.map(it=>({...it, day:days[Math.floor(Math.random()*5)], period:vp[Math.floor(Math.random()*9)]})));
    let gen = 0;
    const timer = setInterval(() => {
        gen++;
        pop.sort((a,b)=>calculateFitness(b)-calculateFitness(a));
        document.getElementById('gen-count').innerText = gen;
        document.getElementById('best-fit').innerText = "Optimizing Doubles...";
        if(gen % 10 === 0) displayTimetable(pop[0]);
        if(gen > 500) clearInterval(timer);
        
        // Simple reproduction
        let next = pop.slice(0,5);
        while(next.length < 20) {
            let c = JSON.parse(JSON.stringify(next[Math.floor(Math.random()*5)]));
            let t = c[Math.floor(Math.random()*c.length)];
            t.day = days[Math.floor(Math.random()*5)];
            t.period = vp[Math.floor(Math.random()*9)];
            next.push(c);
        }
        pop = next;
    }, 50);
}

function displayTimetable(tt) {
    let html = '';
    days.forEach(day => {
        html += `<div class="day-section"><h3>${day}</h3><table>`;
        config.forms.forEach(f => {
            html += `<tr><td><b>${f}</b></td>`;
            periods.forEach(p => {
                if(p === "BREAK") { html += `<td style="background:#eee"></td>`; }
                else {
                    const s = tt.find(x => x.day === day && x.form === f && x.period === p);
                    html += `<td style="background:${s?getSubjectColor(s.subject):'#fff'}">${s?s.subject:''}</td>`;
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
        const colors = ['#e3f2fd','#f1f8e9','#fff3e0','#fce4ec','#f3e5f5'];
        subjectColors[s] = colors[Object.keys(subjectColors).length % colors.length];
    }
    return subjectColors[s];
}
