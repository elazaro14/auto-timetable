// --- CONFIGURATION & DATA ---
const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const forms = ["F1A", "F1B", "F1C", "F1D", "F1E", "F1F", "F1G", "F2A", "F2B", "F2C", "F2D", "F3A", "F3B", "F3C", "F3D", "F4A", "F4B", "F4C"];
const periods = ["P1", "P2", "P3", "P4", "BREAK", "P5", "P6", "P7", "P8", "P9"];
const times = ["8:00-8:40", "8:40-9:20", "9:20-10:00", "10:00-10:40", "10:40-11:10", "11:10-11:50", "11:50-12:30", "12:30-13:10", "13:10-13:50", "13:50-14:30"];

// Fixed School-Wide Events
const fixedEvents = [
    { day: "WEDNESDAY", periods: ["P7", "P8", "P9"], label: "RELIGION" },
    { day: "FRIDAY", periods: ["P7", "P8", "P9"], label: "MOSQUE" }
];

let subjectsData = [];

// --- STEP 0: TEMPLATE GENERATOR ---
function downloadCSVTemplate() {
    let csv = "Subject,Teacher,Room,Form\n";
    csv += "MATHEMATICS,MR. SMITH,RM 1,F1A\n";
    csv += "BIOLOGY,MS. JONES,LAB A,F1A\n";
    csv += "ENGLISH,DR. BROWN,RM 2,F1B";
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'school_timetable_template.csv';
    a.click();
}

// --- STEP 1: CSV LOADER ---
function handleUpload() {
    const file = document.getElementById('csvFile').files[0];
    if(!file) return alert("Please select a file first!");
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const lines = e.target.result.split('\n');
        subjectsData = [];
        lines.forEach((line, i) => {
            if (i === 0 || !line.trim()) return;
            const [subject, teacher, room, form] = line.split(',');
            if(subject && teacher && form) {
                subjectsData.push({ 
                    subject: subject.trim().toUpperCase(), 
                    teacher: teacher.trim().toUpperCase(), 
                    room: (room || "N/A").trim().toUpperCase(), 
                    form: form.trim().toUpperCase() 
                });
            }
        });
        alert(`Successfully loaded ${subjectsData.length} lessons!`);
        document.getElementById('genBtn').disabled = false;
    };
    reader.readAsText(file);
}

// --- STEP 2: GENETIC ALGORITHM ENGINE ---
function calculateFitness(timetable) {
    let clashes = 0;
    
    timetable.forEach((a, i) => {
        // Penalty: Check if a normal class is scheduled during Religion/Mosque time
        const isFixedTime = fixedEvents.some(event => 
            event.day === a.day && event.periods.includes(a.period)
        );
        if (isFixedTime) clashes += 20; 

        // Penalty: Teacher/Room/Form clashes
        for (let j = i + 1; j < timetable.length; j++) {
            const b = timetable[j];
            if (a.day === b.day && a.period === b.period) {
                if (a.teacher === b.teacher) clashes++; 
                if (a.room === b.room && a.room !== "N/A") clashes++;
                if (a.form === b.form) clashes++;
            }
        }
    });
    return 1 / (1 + clashes);
}

function generateRandomTimetable() {
    const validPeriods = periods.filter(p => p !== "BREAK");
    return subjectsData.map(item => ({
        ...item,
        day: days[Math.floor(Math.random() * days.length)],
        period: validPeriods[Math.floor(Math.random() * validPeriods.length)]
    }));
}

// --- STEP 3: VISUAL RENDERER ---
function displayTimetable(timetable) {
    const display = document.getElementById('timetable-display');
    let html = '';

    days.forEach(day => {
        html += `<div class="day-section"><table>
            <tr class="header-row"><td rowspan="25" class="day-label">${day}</td><td>PERIOD</td>${periods.map(p=>`<td>${p}</td>`).join('')}</tr>
            <tr class="header-row"><td>TIME</td>${times.map(t=>`<td>${t}</td>`).join('')}</tr>`;

        forms.forEach(form => {
            // Yellow separators for class groups
            if (["F2A", "F3A", "F4A"].includes(form)) {
                html += `<tr class="separator"><td colspan="${periods.length + 1}"></td></tr>`;
            }

            html += `<tr><td>${form}</td>`;
            
            periods.forEach(p => {
                const fixed = fixedEvents.find(e => e.day === day && e.periods.includes(p));
                
                if (p === "BREAK") {
                    const showText = ["F1G", "F2D", "F3D"].includes(form);
                    html += `<td class="break-cell">${showText ? 'TEA BREAK' : ''}</td>`;
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

// --- STEP 4: EVOLUTIONARY CONTROLLER ---
function startEvolution() {
    let population = Array.from({ length: 50 }, generateRandomTimetable);
    let gen = 0;
    
    const interval = setInterval(() => {
        gen++;
        population.sort((a, b) => calculateFitness(b) - calculateFitness(a));
        
        const best = population[0];
        const currentFitness = calculateFitness(best);
        const clashCount = (1 / currentFitness) - 1;

        document.getElementById('gen-count').innerText = gen;
        document.getElementById('best-fit').innerText = clashCount <= 0 ? "PERFECT" : clashCount.toFixed(0) + " Clashes";
        
        displayTimetable(best);

        // Success condition
        if (clashCount <= 0 || gen > 1500) {
            clearInterval(interval);
            if(clashCount <= 0) alert("Optimal Timetable Found with Zero Clashes!");
        }

        // Generate next generation
        let nextGen = population.slice(0, 10); // Keep top 10
        while(nextGen.length < 50) {
            let parent = nextGen[Math.floor(Math.random() * 10)];
            let child = JSON.parse(JSON.stringify(parent));
            
            // Apply mutations
            let mutationStrength = clashCount > 5 ? 3 : 1; 
            for(let i=0; i < mutationStrength; i++) {
                let target = child[Math.floor(Math.random() * child.length)];
                target.day = days[Math.floor(Math.random() * days.length)];
                target.period = periods.filter(p => p !== "BREAK")[Math.floor(Math.random() * 9)];
            }
            nextGen.push(child);
        }
        population = nextGen;
    }, 40);
}
