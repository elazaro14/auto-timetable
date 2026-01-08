// --- CONFIGURATION & TIME MAPPING ---
const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const periods = ["P1", "P2", "P3", "P4", "BREAK", "P5", "P6", "P7", "P8", "P9"];

// Map periods to exact minutes from midnight for high-precision checking
const periodTimes = {
    "P1": { start: 480, end: 520 },  // 08:00 - 08:40
    "P2": { start: 520, end: 560 },  // 08:40 - 09:20
    "P3": { start: 560, end: 600 },  // 09:20 - 10:00
    "P4": { start: 600, end: 640 },  // 10:00 - 10:40
    "P5": { start: 670, end: 710 },  // 11:10 - 11:50
    "P6": { start: 710, end: 750 },  // 11:50 - 12:30
    "P7": { start: 750, end: 790 },  // 12:30 - 13:10
    "P8": { start: 790, end: 830 },  // 13:10 - 13:50
    "P9": { start: 830, end: 870 }   // 13:50 - 14:30
};

let config = {
    schoolName: "YOUR SCHOOL NAME",
    academicYear: "2025/2026",
    logoUrl: "logo.png",
    breakLabel: "TEA BREAK",
    forms: ["F1A", "F1B", "F1C", "F1D", "F1E", "F1F", "F1G", "F2A", "F2B", "F2C", "F2D", "F3A", "F3B", "F3C", "F3D", "F4A", "F4B", "F4C"],
    fixedEvents: [
        { day: "WEDNESDAY", periods: ["P7", "P8", "P9"], label: "RELIGION" },
        { day: "FRIDAY", periods: ["P7", "P8", "P9"], label: "MOSQUE" }
    ]
};

let subjectsData = [];
let subjectColors = {};

// --- UTILITY: TIME CONVERTER ---
function parseTimeToMins(timeStr) {
    const [hrs, mins] = timeStr.split(':').map(Number);
    return hrs * 60 + mins;
}

// --- CORE LOGIC: AVAILABILITY CHECKER ---
function isAvailable(lesson, availabilityStr) {
    if (!availabilityStr || availabilityStr === "ALL") return true;
    
    const lessonDay = lesson.day.substring(0, 3); // "MON"
    const lessonTime = periodTimes[lesson.period];
    if (!lessonTime) return true;

    // Split multiple rules: MON(08:00-10:00);WED(12:00-14:00)
    const rules = availabilityStr.split(';');
    
    for (let rule of rules) {
        if (!rule.includes(lessonDay)) continue;

        // Extract time: "08:00-10:00" from "MON(08:00-10:00)"
        const timeMatch = rule.match(/\((.*?)\)/);
        if (!timeMatch) return true; // If only day is mentioned, they are free all day

        const [startStr, endStr] = timeMatch[1].split('-');
        const allowedStart = parseTimeToMins(startStr);
        const allowedEnd = parseTimeToMins(endStr);

        // Check if lesson fits inside allowed window
        if (lessonTime.start >= allowedStart && lessonTime.end <= allowedEnd) {
            return true;
        }
    }
    return false;
}

// --- FITNESS FUNCTION (AI BRAIN) ---
function calculateFitness(timetable) {
    let clashes = 0;
    timetable.forEach((a, i) => {
        // 1. Fixed Event Constraint
        if (config.fixedEvents.some(e => e.day === a.day && e.periods.includes(a.period))) clashes += 100;

        // 2. Day & Hour Availability Constraint
        if (!isAvailable(a, a.availability)) clashes += 50;

        // 3. Physical Clashes (Teacher, Room, Form)
        for (let j = i + 1; j < timetable.length; j++) {
            const b = timetable[j];
            if (a.day === b.day && a.period === b.period) {
                if (a.teacher === b.teacher || a.form === b.form || (a.room === b.room && a.room !== "N/A")) {
                    clashes++;
                }
            }
        }
    });
    return 1 / (1 + clashes);
}

// --- UI & GENERATION ---
function handleUpload() {
    const file = document.getElementById('csvFile').files[0];
    const reader = new FileReader();
    reader.onload = e => {
        subjectsData = e.target.result.split('\n').slice(1).filter(l => l.trim()).map(l => {
            const [s, t, r, f, av] = l.split(',').map(x => x?.trim().toUpperCase());
            return { subject: s, teacher: t, room: r || "N/A", form: f, availability: av || "ALL" };
        });
        document.getElementById('genBtn').disabled = false;
        alert("Data Loaded with Hourly Constraints!");
    };
    reader.readAsText(file);
}

function displayTimetable(tt) {
    document.body.classList.add('show-content');
    let html = '';
    days.forEach(day => {
        html += `<div class="day-section">
            <table>
                <tr class="header-row">
                    <td rowspan="25" class="day-label">${day}</td>
                    <td>PERIOD</td>${periods.map(p => `<td>${p}</td>`).join('')}
                </tr>
                <tr class="header-row">
                    <td>TIME</td>
                    <td>08:00</td><td>08:40</td><td>09:20</td><td>10:00</td>
                    <td style="background:#eee">10:40</td>
                    <td>11:10</td><td>11:50</td><td>12:30</td><td>13:10</td><td>13:50</td>
                </tr>`;
        
        config.forms.forEach(f => {
            if (f.endsWith("A") && f !== config.forms[0]) html += `<tr class="separator"><td colspan="11"></td></tr>`;
            html += `<tr><td>${f}</td>`;
            periods.forEach(p => {
                const fixed = config.fixedEvents.find(e => e.day === day && e.periods.includes(p));
                if (p === "BREAK") {
                    const mid = config.forms[Math.floor(config.forms.length/2)];
                    html += `<td class="break-cell">${f === mid ? config.breakLabel : ''}</td>`;
                } else if (fixed) {
                    html += `<td style="background:#e1f5fe; font-weight:bold;">${fixed.label}</td>`;
                } else {
                    const s = tt.find(x => x.day === day && x.form === f && x.period === p);
                    const isErr = s && !isAvailable(s, s.availability);
                    html += `<td style="background:${s ? getSubjectColor(s.subject) : '#fff'}; border:${isErr ? '2px solid red' : '1px solid #000'}">
                        ${s ? `<strong>${s.subject}</strong>${s.teacher}` : ''}
                    </td>`;
                }
            });
            html += `</tr>`;
        });
        html += `</table></div>`;
    });
    document.getElementById('timetable-display').innerHTML = html;
}

// ... include your existing getSubjectColor, startEvolution, toggleSettings, saveSettings functions here ...
