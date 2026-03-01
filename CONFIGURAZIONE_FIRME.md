# Come salvare le firme della petizione

## 1. Formspree (email) - già configurato ✓

Le firme ti arrivano via email. Già impostato.

## 2. Firebase (mostrare ultime firme a tutti)

Per far vedere a chiunque le ultime firme (anche da altri dispositivi):

1. Vai su **https://console.firebase.google.com**
2. Crea un nuovo progetto
3. Vai su **Realtime Database** → Crea database
4. Nelle **Regole** metti (più sicuro: si possono solo aggiungere firme, non modificare o cancellare):
```json
{
  "rules": {
    "signatures": {
      ".read": true,
      "$sigId": {
        ".write": "!data.exists()"
      }
    }
  }
}
```
5. Copia l'URL del database (es: `https://tuoprogetto-default-rtdb.europe-west1.firebasedatabase.app`)
6. In **config.js** incolla l'URL in `FIREBASE_DB_URL`

Se lasci vuoto, le firme si vedono solo nel browser di chi ha firmato (localStorage).

## 3. Blocco firme duplicate

Ogni utente può firmare **una sola volta** per browser.
