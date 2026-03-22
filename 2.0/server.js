import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import handler from './api/verify.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware, um JSON-Daten zu verstehen (wichtig für den POST-Request)
app.use(express.json());

// Statische Dateien (HTML, CSS, Bilder) aus dem aktuellen Ordner bereitstellen
app.use(express.static(__dirname));

// Die API-Route simulieren und an verify.js weiterleiten
app.all('/api/verify', async (req, res) => {
    await handler(req, res);
});

app.listen(PORT, () => {
    console.log(`Server läuft! Öffnen Sie: http://localhost:${PORT}`);
});