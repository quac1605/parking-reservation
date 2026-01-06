export const calculatePrice = (startTimeStr, endTimeStr) => {
    // Strategies:
    // 18:00 - 22:00: €2.50 / hr
    // 22:00 - 06:00: €1.00 / hr
    // Max Cap: €12.00

    if (!startTimeStr || !endTimeStr) return 0;

    // Helper to convert "18:00" to hour integer 18
    const getHour = (timeStr) => parseInt(timeStr.split(':')[0], 10);
    const getMinute = (timeStr) => parseInt(timeStr.split(':')[1], 10);

    let startHour = getHour(startTimeStr);
    let startMin = getMinute(startTimeStr);
    let endHour = getHour(endTimeStr);
    let endMin = getMinute(endTimeStr);

    // Normalize for "next day" calculation
    // Functional window is 18:00 (18) to 06:00 (30)

    // Adjust logic: treat "00:00" to "06:00" as "24:00" to "30:00" for easier math
    let effectiveStart = startHour + (startMin / 60);
    let effectiveEnd = endHour + (endMin / 60);

    if (effectiveStart < 12) effectiveStart += 24; // e.g. 01:00 becomes 25.0
    if (effectiveEnd < 12) effectiveEnd += 24;     // e.g. 02:00 becomes 26.0

    // Pricing Logic
    let totalPrice = 0;

    // Loop through each half-hour block
    for (let t = effectiveStart; t < effectiveEnd; t += 0.5) {
        // t is current time text. e.g. 18.0, 18.5

        let rate = 0;
        // Peak: 18:00 (18) to 22:00 (22)
        if (t >= 18 && t < 22) {
            rate = 2.50; // Per hour
        }
        // Off-Peak: 22:00 (22) to 06:00 (30)
        else {
            rate = 1.00; // Per hour
        }

        // Add price for 30 mins (0.5 hours)
        totalPrice += (rate * 0.5);
    }

    // Cap at €12.00
    return Math.min(totalPrice, 12.00).toFixed(2);
};
