// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Attach event listeners to fix the "not working" issue
    document.getElementById('settingsBtn').onclick = toggleSettings;
    document.getElementById('saveBtn').onclick = saveSettings;
    document.getElementById('dlBtn').onclick = downloadCSVTemplate;
    document.getElementById('ulBtn').onclick = () => document.getElementById('csvFile').click();
    document.getElementById('csvFile').onchange = handleUpload;
    document.getElementById('genBtn').onclick = startEvolution;
    document.getElementById('overlay').onclick = toggleSettings;
});

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
    schoolName: "YOUR SCHOOL NAME", academicYear: "2025/2026", logoUrl: "logo.png",
    breakLabel: "TEA BREAK",
    forms: ["F1A", "F1B", "F1C", "F1D", "F1E", "F1F", "F1G", "F2A", "F2B", "F2C", "F2D", "F3A", "F3B", "F3C", "F3D", "F4A", "F4B", "F4C"],
    fixedEvents: [
        { day: "WEDNESDAY", periods: ["P7", "P8", "P9"], label: "RELIGION" },
        { day: "FRIDAY", periods: ["P7", "P8", "P9"], label: "MOSQUE" }
    ]
};

let subjectsData = [], subjectColors = {};

// --- FUNCTIONS ---

function toggleSettings() {
    const p = document.getElementById('settings-panel');
    const o = document.getElementById('overlay');
    const isHidden = p.style.display === 'none' || p.style.display === '';
    p.style.display = isHidden ? 'block' : 'none';
    o.style.display = isHidden ? 'block' : 'none';
}

function saveSettings() {
    config.schoolName = document.getElementById('cfg-school-name').value;
    config.academicYear = document.getElementById('cfg-academic-year').value;
    config.logoUrl = document.getElementById('cfg-logo-url').value;
    config.breakLabel = document.getElementById('cfg-break-label').value.toUpperCase();
    config.forms = document.getElementById('cfg-forms').value.split(',').map(s => s.trim().toUpperCase());
    
    document.getElementById('display-school-name').innerText = config.schoolName;
    document.getElementById('display-academic-year').innerText = "ACADEMIC YEAR: " + config.academicYear;
    document.getElementById('school-logo-img').src = config.logoUrl;
    toggleSettings();
}

function downloadCSVTemplate() {
    const csv = "Subject,Teacher,Room,Form,Availability\nMATHEMATICS,MR. SMITH,RM 1,F1A,MON(08:00-10:40)\nBIOLOGY,MS. JONES,LAB A,F1A,ALL";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'school_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const lines = e.target.result.split('\n');
        subjectsData = lines.slice(1).filter(l => l.trim()).map(l => {
            const [s, t, r, f, av] = l.split(',').map(x => x?.trim().toUpperCase());
            return { subject: s, teacher: t, room: r || "N/A", form: f, availability: av || "ALL" };
        });
        document.getElementById('genBtn').disabled = false;
        document.getElementById('best-fit').innerText = "Data Loaded. Press Generate.";
        alert("File loaded successfully!");
    };
    reader.readAsText(file);
}

// (Keep the rest of your AI logic: calculateFitness, startEvolution, displayTimetable)
// Make sure calculateFitness and isAvailable functions are included at the bottom!
