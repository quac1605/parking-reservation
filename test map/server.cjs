const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const filePath = path.join(__dirname, 'src', 'assets', 'coordinates_decimal.txt');

// Read coordinates
app.get('/api/coordinates', (req, res) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error reading file');
        }
        // Parse tab-separated values
        const lines = data.trim().split('\n');
        // Skip empty lines or header if malformed
        if (lines.length === 0) return res.json([]);

        // Header is usually first line
        const headers = lines[0].split('\t');

        const coordinates = lines.slice(1).map(line => {
            if (!line.trim()) return null;
            const values = line.split('\t');
            // Ensure we have enough values
            if (values.length < 3) return null;

            return {
                file: values[0],
                lat: parseFloat(values[1]),
                lng: parseFloat(values[2])
            };
        }).filter(item => item !== null && !isNaN(item.lat) && !isNaN(item.lng));

        res.json(coordinates);
    });
});

// Update or Add coordinates
app.post('/api/coordinates', (req, res) => {
    const newCoordinates = req.body; // Expecting array of {file, lat, lng}

    if (!Array.isArray(newCoordinates)) {
        return res.status(400).send('Invalid data format');
    }

    // Format back to TSV
    let fileContent = 'file\tlat_dd\tlon_dd\n';
    newCoordinates.forEach(coord => {
        fileContent += `${coord.file}\t${coord.lat}\t${coord.lng}\n`;
    });

    fs.writeFile(filePath, fileContent, 'utf8', (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error writing file');
        }

        // --- AUTOMATIC SLOTS UPDATE ---
        const slotsPath = path.join(__dirname, 'src', 'assets', 'Front Parking Slots.txt');
        const markers = newCoordinates; // Use the data from request directly
        const slots = [];

        try {
            // F1 to F20
            for (let i = 0; i < 20; i++) {
                const u = 110 + i; const l = 89 - i;
                if (markers[u] && markers[u + 1] && markers[l] && markers[l - 1]) {
                    slots.push({ name: `F${i + 1}`, coords: [markers[u], markers[u + 1], markers[l - 1], markers[l]] });
                }
            }
            // F21
            if (markers[90] && markers[91] && markers[155] && markers[156]) {
                slots.push({ name: 'F21', coords: [markers[90], markers[91], markers[155], markers[156]] });
            }
            // F22 to F39
            for (let i = 0; i < 18; i++) {
                const u = 91 + i; const l = 155 - i;
                if (markers[u] && markers[u + 1] && markers[l] && markers[l - 1]) {
                    slots.push({ name: `F${22 + i}`, coords: [markers[u], markers[u + 1], markers[l - 1], markers[l]] });
                }
            }
            // F40
            if (markers[68] && markers[109] && markers[137] && markers[136]) {
                slots.push({ name: 'F40', coords: [markers[68], markers[109], markers[137], markers[136]] });
            }

            let slotsContent = 'Slot_Name\tCoordinates (Lat, Lng)\n';
            slots.forEach(s => {
                const cStr = s.coords.map(c => `[${c.lat}, ${c.lng}]`).join(', ');
                slotsContent += `${s.name}\t${cStr}\n`;
            });
            fs.writeFileSync(slotsPath, slotsContent, 'utf8');
            console.log('Front Parking Slots.txt updated automatically.');

            // --- BACK PARKING SLOTS ---
            const backSlotsPath = path.join(__dirname, 'src', 'assets', 'Back Parking Slots.txt');
            const backSlots = [];
            // B1
            if (markers[0] && markers[1] && markers[158] && markers[157]) {
                backSlots.push({ name: 'B1', coords: [markers[0], markers[1], markers[158], markers[157]] });
            }
            // B2 to B6
            for (let i = 0; i < 5; i++) {
                const u = 1 + i; const l = 159 + i;
                if (markers[u] && markers[u + 1] && markers[l] && markers[l - 1]) {
                    backSlots.push({ name: `B${2 + i}`, coords: [markers[u], markers[u + 1], markers[l], markers[l - 1]] });
                }
            }
            // B7
            if (markers[6] && markers[7] && markers[9] && markers[163]) {
                backSlots.push({ name: 'B7', coords: [markers[6], markers[7], markers[9], markers[163]] });
            }
            // B8
            if (markers[26] && markers[28] && markers[29] && markers[27]) {
                backSlots.push({ name: 'B8', coords: [markers[26], markers[28], markers[29], markers[27]] });
            }
            // B9
            if (markers[28] && markers[30] && markers[31] && markers[29]) {
                backSlots.push({ name: 'B9', coords: [markers[28], markers[30], markers[31], markers[29]] });
            }
            // B10
            if (markers[30] && markers[32] && markers[33] && markers[31]) {
                backSlots.push({ name: 'B10', coords: [markers[30], markers[32], markers[33], markers[31]] });
            }
            // B11
            if (markers[32] && markers[57] && markers[58] && markers[33]) {
                backSlots.push({ name: 'B11', coords: [markers[32], markers[57], markers[58], markers[33]] });
            }
            // B12
            if (markers[55] && markers[67] && markers[66] && markers[56]) {
                backSlots.push({ name: 'B12', coords: [markers[55], markers[67], markers[66], markers[56]] });
            }
            // B13
            if (markers[67] && markers[64] && markers[65] && markers[66]) {
                backSlots.push({ name: 'B13', coords: [markers[67], markers[64], markers[65], markers[66]] });
            }
            // B14
            if (markers[64] && markers[63] && markers[62] && markers[65]) {
                backSlots.push({ name: 'B14', coords: [markers[64], markers[63], markers[62], markers[65]] });
            }
            // B15
            if (markers[63] && markers[60] && markers[61] && markers[62]) {
                backSlots.push({ name: 'B15', coords: [markers[63], markers[60], markers[61], markers[62]] });
            }
            // B16
            if (markers[13] && markers[14] && markers[11] && markers[10]) {
                backSlots.push({ name: 'B16', coords: [markers[13], markers[14], markers[11], markers[10]] });
            }
            // B17
            if (markers[14] && markers[15] && markers[12] && markers[11]) {
                backSlots.push({ name: 'B17', coords: [markers[14], markers[15], markers[12], markers[11]] });
            }
            // B18
            if (markers[15] && markers[16] && markers[17] && markers[12]) {
                backSlots.push({ name: 'B18', coords: [markers[15], markers[16], markers[17], markers[12]] });
            }
            // B19
            if (markers[18] && markers[19] && markers[23] && markers[22]) {
                backSlots.push({ name: 'B19', coords: [markers[18], markers[19], markers[23], markers[22]] });
            }
            // B20 to B21
            for (let i = 0; i < 2; i++) {
                const u = 19 + i; const l = 23 + i;
                if (markers[u] && markers[u + 1] && markers[l] && markers[l + 1]) {
                    backSlots.push({ name: `B${20 + i}`, coords: [markers[u], markers[u + 1], markers[l + 1], markers[l]] });
                }
            }
            // B22
            if (markers[21] && markers[135] && markers[34] && markers[25]) {
                backSlots.push({ name: 'B22', coords: [markers[21], markers[135], markers[34], markers[25]] });
            }
            // B23 to B25 (sequential pins)
            for (let i = 0; i < 3; i++) {
                const u = 131 + i; // Pin 132, 133, 134
                const l = 35 + i;  // Pin 36, 37, 38
                if (markers[u] && markers[u + 1] && markers[l] && markers[l + 1]) {
                    backSlots.push({ name: `B${23 + i}`, coords: [markers[u], markers[u + 1], markers[l + 1], markers[l]] });
                }
            }
            // B26
            if (markers[134] && markers[40] && markers[39] && markers[38]) {
                backSlots.push({ name: 'B26', coords: [markers[134], markers[40], markers[39], markers[38]] });
            }
            // B27
            if (markers[41] && markers[42] && markers[49] && markers[48]) {
                backSlots.push({ name: 'B27', coords: [markers[41], markers[42], markers[49], markers[48]] });
            }
            // B28 to B32
            for (let i = 0; i < 5; i++) {
                const u = 42 + i; // Pin 43...
                const l = 49 + i; // Pin 50...
                if (markers[u] && markers[u + 1] && markers[l] && markers[l + 1]) {
                    backSlots.push({ name: `B${28 + i}`, coords: [markers[u], markers[u + 1], markers[l + 1], markers[l]] });
                }
            }
            // B33
            if (markers[47] && markers[164] && markers[59] && markers[54]) {
                backSlots.push({ name: 'B33', coords: [markers[47], markers[164], markers[59], markers[54]] });
            }
            // B34
            if (markers[175] && markers[174] && markers[185] && markers[186]) {
                backSlots.push({ name: 'B34', coords: [markers[175], markers[174], markers[185], markers[186]] });
            }
            // B35 to B43
            for (let i = 0; i < 9; i++) {
                const u = 174 - i; const l = 185 - i;
                if (markers[u] && markers[u - 1] && markers[l] && markers[l - 1]) {
                    backSlots.push({ name: `B${35 + i}`, coords: [markers[u], markers[u - 1], markers[l - 1], markers[l]] });
                }
            }
            // B44
            if (markers[176] && markers[175] && markers[186] && markers[187]) {
                backSlots.push({ name: 'B44', coords: [markers[176], markers[175], markers[186], markers[187]] });
            }

            if (backSlots.length > 0) {
                let backContent = 'Slot_Name\tCoordinates (Lat, Lng)\n';
                backSlots.forEach(s => {
                    const cStr = s.coords.map(c => `[${c.lat}, ${c.lng}]`).join(', ');
                    backContent += `${s.name}\t${cStr}\n`;
                });
                fs.writeFileSync(backSlotsPath, backContent, 'utf8');
                console.log('Back Parking Slots.txt updated automatically.');
            }

        } catch (sErr) {
            console.error('Error updating slots files:', sErr);
        }
        // --- END AUTOMATIC UPDATE ---

        res.send('File updated successfully');
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
