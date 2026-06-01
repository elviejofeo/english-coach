# English Pro Coach 🎧

## Archivos del proyecto
```
english-coach-v4/
├── api/
│   └── claude.js        ← proxy seguro (tu API key va aquí en Vercel)
├── src/
│   ├── App.jsx          ← toda la app
│   └── main.jsx
├── public/
│   └── manifest.json    ← para instalar como app en cel
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

## Deploy en Vercel — paso a paso

### 1. Sube a GitHub
- Ve a github.com → New repository → nombre: `english-coach` → Create
- Descomprime este ZIP
- Abre terminal en la carpeta y corre:
```
git init
git add .
git commit -m "english coach v4"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/english-coach.git
git push -u origin main
```

### 2. Deploy en Vercel
- Ve a vercel.com → Add New Project → Import desde GitHub
- Selecciona el repo `english-coach`
- Framework: Vite (lo detecta solo)
- Clic Deploy → espera 2 min

### 3. Agrega tu API Key
- En Vercel: Settings → Environment Variables
- Name: `ANTHROPIC_API_KEY`
- Value: tu key de console.anthropic.com
- Save → Deployments → Redeploy

### 4. Instalar en cel
- Android Chrome: menú ⋮ → Añadir a pantalla de inicio
- iPhone Safari: botón compartir → Añadir a pantalla de inicio

### Compartir
Manda la URL de Vercel por WhatsApp. Tu amiga hace el paso 4.
