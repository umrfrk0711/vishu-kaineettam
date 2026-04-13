# 🌸 Vishu Scratch Card App

A Vishu-festival themed scratch card web app with Firebase real-time integration.

---

## 🚀 Firebase Setup (Required)

### Step 1 — Create a Firebase project
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `vishu-scratch`)
3. Disable Google Analytics (optional) → **Create project**

### Step 2 — Enable Firestore
1. In the left sidebar → **Build → Firestore Database**
2. Click **Create database** → choose **Start in test mode** → select a region → **Enable**

### Step 3 — Register a Web App
1. Project Overview → click the **`</>`** (Web) icon
2. Register app (name it anything) → copy the `firebaseConfig` object

### Step 4 — Paste config into firebase.js
Open `firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123...",
};
```

---

## 🎵 Adding Audio (Optional)

Place audio files in `assets/audio/`:
- `vishu-music.mp3` — background looping music
- `scratch.mp3` — short scratch sound effect

Free sources: [pixabay.com/music](https://pixabay.com/music/) (search "festival" or "coins")

---

## 📁 Project Structure

```
vishu/
├── index.html       ← Main scratch card page
├── admin.html       ← Live results dashboard
├── style.css        ← All styles
├── script.js        ← Scratch card logic
├── firebase.js      ← Firebase config & helpers
└── assets/
    ├── audio/
    │   ├── vishu-music.mp3
    │   └── scratch.mp3
    └── images/      ← (reserved for future use)
```

---

## 🌐 Running Locally

Because `firebase.js` uses ES modules (`import/export`), you need a local server:

```bash
# Option 1 — VS Code Live Server extension (recommended)
# Right-click index.html → "Open with Live Server"

# Option 2 — Python
python -m http.server 8080

# Option 3 — Node.js
npx serve .
```

Then open:
- `http://localhost:8080/` → Scratch card page
- `http://localhost:8080/admin.html` → Live admin dashboard

---

## 🚀 Deploy to GitHub Pages

1. Push all files to a GitHub repository
2. Go to **Settings → Pages → Source → main branch / root**
3. Your app will be live at `https://<username>.github.io/<repo>/`

> ⚠️ Make sure your Firebase project's **Authorized domains** includes your GitHub Pages URL:
> Firebase Console → Authentication → Settings → Authorized domains → Add domain

---

## 🔒 Firestore Security Rules (Production)

For production, replace test-mode rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scratchResults/{doc} {
      allow read: if true;
      allow create: if request.resource.data.amount is int
                    && request.resource.data.amount in [100, 200, 300];
    }
  }
}
```
