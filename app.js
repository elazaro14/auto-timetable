const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const forms = ["F1A", "F1B", "F1C", "F1D", "F1E", "F1F", "F1G", "F2A", "F2B", "F2C", "F2D", "F3A", "F3B", "F3C", "F3D", "F4A", "F4B", "F4C"];
const periods = ["P1", "P2", "P3", "P4", "BREAK", "P5", "P6", "P7", "P8", "P9"];
const times = ["8:00-8:40", "8:40-9:20", "9:20-10:00", "10:00-10:40", "10:40-11:10", "11:10-11:50", "11:50-12:30", "12:30-13:10", "13:10-13:50", "13:50-14:30"];

let subjectsData = [];

// Step 0: Download CSV Template
function downloadCSVTemplate() {
    let csv = "Subject,Teacher,Room,Form\n";
    // Adding dummy examples
    csv += "MATHEMATICS,MR. SMITH,RM 1,F1A\n";
    csv += "BIOLOGY,MS. JONES,LAB A,F1A\n";
    csv += "ENGLISH,DR. BROWN,RM 2,F1B";
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timetable_template.csv';
    a.click();
}

// Step 1: Handle CSV Upload
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
                    subject: subject.trim(), 
                    teacher: teacher.trim(), 
                    room: (room || "N/A").trim(), 
                    form: form.trim() 
                });
            }
        });
        alert(`Loaded ${subjectsData.length} lesson requirements!`);
        document.getElementById('genBtn').disabled = false;
    };
    reader.readAsText(file);
}

// Step 2: Genetic Algorithm Logic
function calculateFitness(timetable) {
    let clashes = 0;
    for (let i = 0; i < timetable.length; i++) {
        for (let j = i + 1; j < timetable.length; j++) {
            const a = timetable[i];
            const b = timetable[j];
            if (a.day === b.day && a.period === b.period) {
                if (a.teacher === b.teacher) clashes++; // Teacher can't be in 2 places
                if (a.room === b.room && a.room !== "N/A") clashes++; // Room can't hold 2 classes
                if (a.form === b.form) clashes++; // Form can't have 2 subjects at once
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

// Step 3: Render the Table
function displayTimetable(timetable) {
    const display = document.getElementById('timetable-display');
    let html = '';

    days.forEach(day => {
        html += `<div class="day-section"><table>
            <tr class="header-row"><td rowspan="25" class="day-label">${day}</td><td>PERIOD</td>${periods.map(p=>`<td>${p}</td>`).join('')}</tr>
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

// Evolution Engine
function startEvolution() {
    let population = Array.from({ length: 40 }, generateRandomTimetable);
    let gen = 0;
    
    const interval = setInterval(() => {
        gen++;
        population.sort((a, b) => calculateFitness(b) - calculateFitness(a));
        
        document.getElementById('gen-count').innerText = gen;
        document.getElementById('best-fit').innerText = (1/calculateFitness(population[0]) - 1) + " Clashes";
        
        displayTimetable(population[0]);

        if (calculateFitness(population[0]) === 1 || gen > 800) {
            clearInterval(interval);
            if(calculateFitness(population[0]) === 1) alert("Perfect Timetable Found!");
        }

        // Create next generation
        let nextGen = population.slice(0, 10);
        while(nextGen.length < 40) {
            let parent = nextGen[Math.floor(Math.random() * 10)];
            let child = JSON.parse(JSON.stringify(parent));
            // Mutate 2 random classes
            for(let i=0; i<2; i++) {
                let target = child[Math.floor(Math.random() * child.length)];
                target.day = days[Math.floor(Math.random() * days.length)];
                target.period = periods.filter(p => p !== "BREAK")[Math.floor(Math.random() * 9)];
            }
            nextGen.push(child);
        }
        population = nextGen;
    }, 50);
}
