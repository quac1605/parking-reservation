export const calculatePrice = (startTimeStr, endTimeStr) => {
    // Strategies:
    // 18:00 - 22:00: €2.50 / hr (Peak)
    // 22:00 - 06:00: €1.00 / hr (Off-Peak)
    // 06:00 - 18:00: €1.00 / hr (Daytime Weekend Off-Peak)
    // User requirement: "Reserve on Sat/Sun for whole day".
    // Assume €1.00/hr for daytime weekend.

    if (!startTimeStr || !endTimeStr) return '0.00';

    // Helper: Parse "Day HH:MM" to a Date object relative to "Now"
    const parseDateValues = (str) => {
        // str format: "Fri 18:00" or just "18:00" (backward compatibility?)
        // The new dashboard always produces "Day HH:MM".
        const parts = str.split(' ');
        let dayName, timePart;

        if (parts.length === 2) {
            dayName = parts[0];
            timePart = parts[1];
        } else {
            // Fallback for "18:00" without day
            dayName = null;
            timePart = str;
        }

        const [h, m] = timePart.split(':').map(Number);
        return { dayName, h, m };
    };

    // Establish a relative timeline between Start and End.
    // Create actual Date objects assuming they are within the next 7 days.

    const getRealDate = (str) => {
        const { dayName, h, m } = parseDateValues(str);
        const d = new Date();
        d.setHours(h, m, 0, 0);

        if (dayName) {
            const daysMap = { 'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6 };
            const targetDay = daysMap[dayName];
            const currentDay = new Date().getDay();

            // Calculate day difference
            let diff = targetDay - currentDay;
            if (diff < 0) diff += 7;
            d.setDate(new Date().getDate() + diff);
        }
        return d;
    };

    const start = getRealDate(startTimeStr);
    let end = getRealDate(endTimeStr);

    if (end < start) {
        end.setDate(end.getDate() + 1); // Fallback for simple wrapping
        // If "Mon" < "Fri", our logic above (diff) handled it.
    }

    // Iterate through hours
    let totalPrice = 0;
    const durationMs = end - start;
    const durationHours = durationMs / (1000 * 60 * 60);

    let current = new Date(start);

    // Loop every 30 mins
    while (current < end) {
        const h = current.getHours();

        let rate = 1.00; // Default Off-Peak (22-06 and Daytime 06-18)

        // Peak logic: 18:00 - 22:00
        if (h >= 18 && h < 22) {
            rate = 2.50;
        } else {
            // Off-Peak (22-06) = 1.00
            // Daytime (06-18) = 1.00
            rate = 1.00;
        }

        totalPrice += (rate * 0.5); // 30 min block
        current.setMinutes(current.getMinutes() + 30);
    }
    return totalPrice.toFixed(2);
};


