import { format } from 'date-fns';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

export const HALLS = [
    'Hall A', 'Hall B', 'Hall C', 'Hall D', 'Hall E',
    'Main Auditorium', 'Lab 1', 'Lab 2',
];

export const SUBJECTS = [
    { name: 'Combined Maths', teacher: 'Mr. Perera', colors: 'bg-blue-50   border-blue-200   text-blue-800' },
    { name: 'Physics', teacher: 'Dr. Silva', colors: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    { name: 'Chemistry', teacher: 'Mrs. Fernando', colors: 'bg-purple-50  border-purple-200  text-purple-800' },
    { name: 'Biology', teacher: 'Mr. Kumara', colors: 'bg-rose-50    border-rose-200    text-rose-800' },
    { name: 'IT', teacher: 'Miss Alwis', colors: 'bg-amber-50   border-amber-200   text-amber-800' },
    { name: 'English', teacher: 'Mr. Watson', colors: 'bg-indigo-50  border-indigo-200  text-indigo-800' },
];

export const HOUR_HEIGHT = 80; // px per hour

// ─── MOCK GENERATOR ───────────────────────────────────────────────────────────

/**
 * Deterministically generates mock class sessions for a given date.
 * The same date always returns the same schedule.
 */
export const generateMockClassesForDate = (date) => {
    const day = date.getDate();
    const classes = [];
    const numClasses = (day % 8) + 8;

    for (let i = 0; i < numClasses; i++) {
        const hallIndex = (day + i) % HALLS.length;
        const subjectIndex = (day * 2 + i * 3) % SUBJECTS.length;
        const startHour = 8 + ((day + i * 2) % 11); // 8 AM – 6 PM
        const durationHours = 1 + ((day + i) % 3);      // 1–3 hours

        if (startHour + durationHours > 23.5) continue;

        const endHourFull = startHour + durationHours;
        const endH = Math.floor(endHourFull);
        const endM = Math.round((endHourFull % 1) * 60);

        classes.push({
            id: `${day}-${i}`,
            ...SUBJECTS[subjectIndex],
            hall: HALLS[hallIndex],
            startHour,
            durationHours,
            timeString:
                `${format(new Date().setHours(startHour, 0, 0, 0), 'h:mm a')} - ` +
                `${format(new Date().setHours(endH, endM, 0, 0), 'h:mm a')}`,
        });
    }
    return classes;
};
