#!/usr/bin/env node
/**
 * Script per auto-aggiornare gallery-data.js leggendo le foto da "foto adesione"
 * Uso: node update-gallery.js
 */

const fs = require('fs');
const path = require('path');

// Estensioni immagine riconosciute
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];

// Cartella sorgente
const PHOTO_DIR = path.join(__dirname, 'foto adesione');
const OUTPUT_FILE = path.join(__dirname, 'gallery-data.js');

try {
    // Leggi tutti i file nella cartella "foto adesione"
    const files = fs.readdirSync(PHOTO_DIR);
    
    // Filtra solo file immagine
    const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext);
    }).sort();
    
    if (imageFiles.length === 0) {
        console.warn('⚠️  Nessuna foto trovata in "foto adesione"');
        process.exit(1);
    }
    
    // Genera array GALLERY_PHOTOS
    const photoEntries = imageFiles.map(file => {
        // Estrai nome da filename (senza estensione, poi capitalize)
        const nameFromFile = path.basename(file, path.extname(file));
        const displayName = nameFromFile
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        
        return {
            src: `foto adesione/${file}`,
            name: displayName
        };
    });
    
    // Genera il contenuto JavaScript
    const jsContent = `// Aggiungi qui le foto di chi aderisce a #freenekrofilo sui social
// Per aggiungere una nuova foto: mettila nella cartella "foto adesione" e esegui: node update-gallery.js
// Formato: { src: "foto adesione/nomefile.jpg", name: "Nome" }
const GALLERY_PHOTOS = [
${photoEntries.map(p => `    { src: "${p.src}", name: "${p.name}" }`).join(',\n')}
];
`;
    
    // Scrivi nel file
    fs.writeFileSync(OUTPUT_FILE, jsContent, 'utf8');
    
    console.log(`✅ gallery-data.js aggiornato con ${photoEntries.length} foto`);
    console.log('📸 Foto trovate:');
    photoEntries.forEach(p => console.log(`   - ${p.src} (${p.name})`));
    
} catch (err) {
    console.error('❌ Errore:', err.message);
    process.exit(1);
}
