// Storage key per le firme
const STORAGE_KEY = 'freenekrofilo_signatures';
const HAS_SIGNED_KEY = 'freenekrofilo_hasSigned';

// Reset firme di prova: visita firma.html?reset=1 per cancellare
if (window.location.search.includes('reset=1')) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(HAS_SIGNED_KEY);
    window.history.replaceState({}, '', window.location.pathname);
}

// Elementi DOM (potrebbero non esistere su index.html)
const petitionForm = document.getElementById('petitionForm');
const petitionFormWrapper = document.getElementById('petitionFormWrapper');
const signatureCount = document.getElementById('signatureCount');
const signaturesList = document.getElementById('signaturesList');
const copyBtn = document.getElementById('copyBtn');
const toast = document.getElementById('toast');
const alreadySignedEl = document.getElementById('alreadySigned');

// Carica le firme dal localStorage
function loadSignatures() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

// Salva le firme nel localStorage
function saveSignatures(signatures) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(signatures));
}

// Carica firme da Firebase
async function loadSignaturesFromFirebase() {
    const url = (typeof FIREBASE_DB_URL !== 'undefined' ? FIREBASE_DB_URL : '') || '';
    if (!url) return null;
    try {
        const baseUrl = url.replace(/\/$/, '');
        const fetchUrl = baseUrl + '/signatures.json?cb=' + Date.now();
        console.log('Fetching signatures from Firebase:', fetchUrl);
        const res = await fetch(fetchUrl);
        if (!res.ok) {
            console.warn('Firebase fetch failed:', res.status, res.statusText);
            return null;
        }
        const data = await res.json();
        console.log('Firebase data received:', data);
        if (!data) return [];
        // Trasforma l'oggetto in array, ordina per data e restituisci tutte le firme
        return Object.entries(data)
            .map(([id, v]) => ({ ...v, id }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (e) {
        console.error('Errore caricamento firme da Firebase:', e);
        return null;
    }
}

// Salva firma su Firebase
async function saveToFirebase(name, message) {
    const url = (typeof FIREBASE_DB_URL !== 'undefined' ? FIREBASE_DB_URL : '') || '';
    if (!url) return { ok: true };
    try {
        const baseUrl = url.replace(/\/$/, '');
        const res = await fetch(baseUrl + '/signatures.json', {
            method: 'POST',
            body: JSON.stringify({
                name,
                message,
                date: new Date().toISOString()
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('saveToFirebase response:', res.status, res.statusText);
        return res;
    } catch (e) {
        console.error('Errore saveToFirebase:', e);
        return { ok: false };
    }
}

// Aggiorna il contatore e la lista
function renderSignaturesList(signatures) {
    if (!signaturesList) return;
    const recentSignatures = Array.isArray(signatures) ? signatures.slice(0, 15) : [];
    if (recentSignatures.length === 0) {
        signaturesList.innerHTML = '<li class="sig-empty">Nessuna firma ancora. Sii il primo!</li>';
        return;
    }
    signaturesList.innerHTML = '';
    recentSignatures.forEach(sig => {
        const li = document.createElement('li');
        const date = sig.date ? new Date(sig.date).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }) : '';
        const displayName = sig.name && sig.name.trim() ? escapeHtml(sig.name) : 'Anonimo';
        // mostra fino a 200 caratteri invece di 50, evita taglio se possibile
        const MAX_MSG = 200;
        const displayMessage = sig.message && sig.message.trim()
            ? `- "${escapeHtml(sig.message.substring(0, MAX_MSG))}${sig.message.length > MAX_MSG ? '...' : ''}"`
            : '';
        li.innerHTML = `<span class="sig-name">${displayName}</span> ${displayMessage}<br><span class="sig-date">${date}</span>`;
        signaturesList.appendChild(li);
    });
}

function updateUI(signatures) {
    let sigs = signatures;
    
    // Se Firebase manda un oggetto (come abbiamo visto in console), trasformalo in lista
    if (sigs && !Array.isArray(sigs)) {
        sigs = Object.entries(sigs).map(([id, v]) => ({ ...v, id }));
    }
    
    if (!sigs) sigs = [];

    // Ordina per data (dalla più recente)
    const toShow = sigs.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Aggiorna il numero totale
    if (signatureCount) signatureCount.textContent = toShow.length;

    // Mostra i commenti (ultime 15 persone)
    renderSignaturesList(toShow.slice(0, 15));
}

async function loadAndUpdateUI() {
    const firebaseSigs = await loadSignaturesFromFirebase();
    if (firebaseSigs !== null) {
        updateUI(firebaseSigs);
    } else {
        // Se Firebase non è raggiungibile, usa le firme locali salvate in localStorage
        const localSigs = loadSignatures();
        updateUI(localSigs);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Mostra toast
function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Controlla se ha già firmato
function hasAlreadySigned() {
    return localStorage.getItem(HAS_SIGNED_KEY) === 'true';
}

// Salva firma su Formspree (backend)
async function saveToFormspree(name, message) {
    const endpoint = (typeof FORMSPREE_ENDPOINT !== 'undefined' ? FORMSPREE_ENDPOINT : '') || '';
    if (!endpoint || endpoint.includes('TUO_FORM_ID')) {
        return { ok: true }; // Salta se non configurato
    }
    const res = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
            name,
            message,
            _subject: 'Nuova firma #freenekrofilo',
            _template: 'table'
        }),
        headers: { 'Content-Type': 'application/json' }
    });
    return res;
}

// Gestione invio form
if (petitionForm) petitionForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!name) {
        showToast('Inserisci il tuo nome!');
        return;
    }

    // Blocca se ha già firmato
    if (hasAlreadySigned()) {
        showToast('Hai già firmato la petizione!');
        return;
    }

    const btn = petitionForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Invio in corso...';

    try {
        // Salva su Formspree
        const res = await saveToFormspree(name, message);
        if (!res.ok) throw new Error('Errore invio');

        // Salva su Firebase (per mostrare a tutti)
        const fbRes = await saveToFirebase(name, message);
        if (!fbRes || !fbRes.ok) {
            console.warn('Salvataggio su Firebase fallito o non confermato. Firma salvata localmente.');
            showToast('Firma salvata localmente ma NON condivisa pubblicamente.');
        } else {
            console.log('Firma inviata a Firebase con successo.');
        }

        // Salva in localStorage
        const signatures = loadSignatures();
        const newSignature = {
            name,
            message,
            date: new Date().toISOString()
        };
        signatures.push(newSignature);
        saveSignatures(signatures);

        // Marca come già firmato
        localStorage.setItem(HAS_SIGNED_KEY, 'true');

        await loadAndUpdateUI();
        petitionForm.reset();

        showToast('Grazie! La tua firma è stata salvata. #freenekrofilo');

        // Nascondi form e mostra messaggio "già firmato"
        if (petitionFormWrapper) petitionFormWrapper.style.display = 'none';
        if (alreadySignedEl) alreadySignedEl.style.display = 'block';

        // Mostra immagine ban fullscreen
        const fullscreenBan = document.getElementById('fullscreenBan');
        if (fullscreenBan) {
            fullscreenBan.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    } catch (err) {
        showToast('Errore durante l\'invio. Riprova.');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
});

// Copia hashtag
if (copyBtn) copyBtn.addEventListener('click', function() {
    const hashtag = document.getElementById('hashtagCopy').textContent;
    navigator.clipboard.writeText(hashtag).then(() => {
        showToast('Hashtag #freenekrofilo copiato!');
    }).catch(() => {
        showToast('Impossibile copiare');
    });
});

// Aggiorna link di condivisione e UI
document.addEventListener('DOMContentLoaded', function() {
    const currentUrl = window.location.href;
    const encodedUrl = encodeURIComponent(currentUrl);
    const shareText = encodeURIComponent('Firma la petizione #freenekrofilo - Salva l\'account Instagram @nekrofilo da un ban ingiusto! ' + currentUrl);

    const facebookLink = document.querySelector('.share-link.facebook');
    if (facebookLink) {
        facebookLink.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    }

    const whatsappLink = document.querySelector('.share-link.whatsapp');
    if (whatsappLink) {
        whatsappLink.href = `https://wa.me/?text=${shareText}`;
    }

    const twitterLink = document.querySelector('.share-link.twitter');
    if (twitterLink) {
        twitterLink.href = `https://twitter.com/intent/tweet?text=${shareText}`;
    }

    if (signatureCount || signaturesList) loadAndUpdateUI();

    // Se ha già firmato, nascondi form e mostra messaggio
    if (typeof hasAlreadySigned === 'function' && hasAlreadySigned()) {
        if (petitionFormWrapper) petitionFormWrapper.style.display = 'none';
        if (alreadySignedEl) alreadySignedEl.style.display = 'block';
    }

    // Chiudi fullscreen ban
    const fullscreenBan = document.getElementById('fullscreenBan');
    const closeFullscreen = document.getElementById('closeFullscreen');
    if (fullscreenBan && closeFullscreen) {
        closeFullscreen.addEventListener('click', () => {
            fullscreenBan.classList.remove('show');
            document.body.style.overflow = '';
        });
        fullscreenBan.addEventListener('click', (e) => {
            if (e.target === fullscreenBan) {
                fullscreenBan.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && fullscreenBan.classList.contains('show')) {
                fullscreenBan.classList.remove('show');
                document.body.style.overflow = '';
            }
        });
    }
});
