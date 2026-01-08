let teachers = [];
let rooms = [];
let subjects = [];
const timeslots = [1, 2, 3, 4, 5, 6, 7, 8]; // Extended for a full day

function handleUpload() {
    const file = document.getElementById('csvFile').files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n');
        
        // Assume CSV format: Subject,Teacher,Room
        lines.forEach((line, index) => {
            if (index === 0 || line.trim() === "") return; // Skip header
            const [subject, teacher, room] = line.split(',');
            
            if (subject) subjects.push(subject.trim());
            if (teacher && !teachers.includes(teacher.trim())) teachers.push(teacher.trim());
            if (room && !rooms.includes(room.trim())) rooms.push(room.trim());
        });

        alert("Data Loaded! You can now generate the timetable.");
        document.getElementById('genBtn').disabled = false;
    };

    reader.readAsText(file);
}

function calculateFitness(timetable) {
    let clashes = 0;
    for (let i = 0; i < timetable.length; i++) {
        for (let j = i + 1; j < timetable.length; j++) {
            if (timetable[i].timeslot === timetable[j].timeslot) {
                if (timetable[i].teacher === timetable[j].teacher) clashes++;
                if (timetable[i].room === timetable[j].room) clashes++;
            }
        }
    }
    return 1 / (1 + clashes);
}

function generateRandomTimetable() {
    return subjects.map(subject => ({
        subject,
        teacher: teachers[Math.floor(Math.random() * teachers.length)],
        room: rooms[Math.floor(Math.random() * rooms.length)],
        timeslot: timeslots[Math.floor(Math.random() * timeslots.length)]
    }));
}

function displayTimetable(timetable) {
    const display = document.getElementById('timetable-display');
    display.innerHTML = '<div class="timetable-grid"></div>';
    const grid = display.querySelector('.timetable-grid');
    
    // Sort by timeslot for display
    timetable.sort((a, b) => a.timeslot - b.timeslot).forEach(c => {
        grid.innerHTML += `
            <div class="class-card">
                <strong>${c.subject}</strong>
                <span>${c.teacher}</span><br>
                <small>${c.room} | Period ${c.timeslot}</small>
            </div>`;
    });
}

function mutate(timetable) {
    let copy = JSON.parse(JSON.stringify(timetable));
    let randomClass = copy[Math.floor(Math.random() * copy.length)];
    randomClass.timeslot = timeslots[Math.floor(Math.random() * timeslots.length)];
    randomClass.room = rooms[Math.floor(Math.random() * rooms.length)];
    return copy;
}

function startEvolution() {
    let population = Array.from({ length: 50 }, generateRandomTimetable);
    let generation = 0;

    const interval = setInterval(() => {
        generation++;
        population.sort((a, b) => calculateFitness(b) - calculateFitness(a));

        document.getElementById('gen-count').innerText = generation;
        document.getElementById('best-fit').innerText = calculateFitness(population[0]).toFixed(3);
        displayTimetable(population[0]);

        if (calculateFitness(population[0]) === 1 || generation > 200) {
            clearInterval(interval);
        }

        let nextGen = population.slice(0, 10); 
        while(nextGen.length < 50) {
            nextGen.push(mutate(nextGen[Math.floor(Math.random() * 10)]));
        }
        population = nextGen;
    }, 100);

}
