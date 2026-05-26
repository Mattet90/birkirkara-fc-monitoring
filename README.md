# Ravenna FC – Monitoraggio Atletico 2026/27

Web app per il monitoraggio atletico della squadra: RPE, Training Load, GPS, Frequenza Cardiaca, Wellness (Hooper esteso 5 dimensioni), ACWR, Monotonia e Indice di Fatica.

## Struttura file

```
ravenna-app/
├── index.html   ← struttura HTML e stili
├── app.js       ← tutta la logica JavaScript
└── README.md    ← questo file
```

## Deploy su GitHub Pages (istruzioni passo per passo)

### 1. Crea il repository su GitHub
1. Vai su [github.com](https://github.com) e accedi
2. Clicca **New repository** (pulsante verde in alto a destra)
3. Nome repository: `ravenna-fc-monitoring` (o quello che preferisci)
4. Visibilità: **Public** (necessario per GitHub Pages gratuito)
5. Clicca **Create repository**

### 2. Carica i file
Hai due opzioni:

**Opzione A – Drag & drop (più semplice)**
1. Apri il repository appena creato
2. Clicca **uploading an existing file**
3. Trascina `index.html` e `app.js` nella finestra
4. Scrivi un messaggio di commit: `Prima versione app`
5. Clicca **Commit changes**

**Opzione B – Git da terminale**
```bash
git clone https://github.com/TUOUSERNAME/ravenna-fc-monitoring.git
cd ravenna-fc-monitoring
# copia index.html e app.js in questa cartella
git add .
git commit -m "Prima versione app"
git push origin main
```

### 3. Attiva GitHub Pages
1. Nel repository, vai su **Settings** (ingranaggio in alto)
2. Nel menu laterale clicca **Pages**
3. In **Source** seleziona: `Deploy from a branch`
4. Branch: `main` · Cartella: `/ (root)`
5. Clicca **Save**

### 4. Accedi all'app
Dopo 1-2 minuti l'app sarà disponibile all'indirizzo:
```
https://TUOUSERNAME.github.io/ravenna-fc-monitoring/
```

## Aggiornare l'app in futuro
Per aggiornare basta caricare i file modificati nello stesso repository (stessa procedura del punto 2). GitHub Pages si aggiorna automaticamente in pochi secondi.

## Google Forms collegati
- **RPE**: `1CgUuCPakmhgif-cIJI0PSeFqvFQy-QBFldpGfr9A1KE`
- **Wellness**: `1pOCUqz8usBdnt18N08Nd2XjMDgaxFN2FIu2HfPKAGqY`

Per la sincronizzazione automatica i fogli Google devono essere condivisi come **"Chiunque con il link può visualizzare"**.
