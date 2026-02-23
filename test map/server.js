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
        const headers = lines[0].split('\t');
        const coordinates = lines.slice(1).map(line => {
            if (!line.trim()) return null;
            const values = line.split('\t');
            return {
                file: values[0],
                lat: parseFloat(values[1]),
                lng: parseFloat(values[2])
            };
        }).filter(item => item !== null);

        res.json(coordinates);
    });
});

// Update or Add coordinates
app.post('/api/coordinates', (req, res) => {
    const newCoordinates = req.body; // Expecting array of {file, lat, lng}

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
        res.send('File updated successfully');
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
