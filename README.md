# Video Gallery V7

## English
A modern video gallery application built with React, TypeScript, and Supabase. This application allows users to create and manage video galleries with advanced features and a user-friendly interface.

### Features

#### User Management 👥
- User registration and login with email
- Password reset functionality
- User profile management
- Account settings customization

#### Gallery Management 📁
- Create multiple galleries
- Set gallery privacy (public/private)
- Customize gallery names and descriptions
- Delete galleries with confirmation
- View all created galleries in dashboard

#### Video Management 🎥
- Upload videos to specific galleries
- Support for multiple video formats
- Video preview functionality
- Delete videos from galleries
- Move videos between galleries
- Batch video operations

#### Tagging System 🏷️
- Add multiple tags to videos
- Create custom tag categories
- Filter videos by tags
- Tag management interface
- Batch tag operations

#### Search and Filter 🔍
- Search videos by name
- Filter by tags
- Sort by various criteria
- Advanced filtering options
- Save filter preferences

#### User Interface 🎨
- Responsive design for all devices
- Dark/light mode support
- Modern, clean interface
- Loading animations
- Error handling notifications

#### Security 🔒
- Private gallery protection
- User authentication
- Secure video storage
- Protected API endpoints

### Technical Requirements
- Node.js 16 or higher
- Modern web browser
- Supabase account for backend
- Environment variables configuration

### Installation
1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Set up environment variables in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
4. Start development server:
```bash
npm run dev
```

## Magyar
Modern videó galéria alkalmazás React, TypeScript és Supabase technológiákkal. Az alkalmazás lehetővé teszi a felhasználók számára videó galériák létrehozását és kezelését fejlett funkciókkal és felhasználóbarát felülettel.

### Funkciók

#### Felhasználókezelés 👥
- Regisztráció és bejelentkezés e-maillel
- Jelszó visszaállítási lehetőség
- Felhasználói profil kezelése
- Fiókbeállítások testreszabása

#### Galéria Kezelés 📁
- Több galéria létrehozása
- Galéria láthatóság beállítása (nyilvános/privát)
- Galéria nevek és leírások testreszabása
- Galériák törlése megerősítéssel
- Összes létrehozott galéria megtekintése a vezérlőpulton

#### Videó Kezelés 🎥
- Videók feltöltése specifikus galériákba
- Többféle videóformátum támogatása
- Videó előnézeti funkció
- Videók törlése galériákból
- Videók áthelyezése galériák között
- Csoportos videó műveletek

#### Címkézési Rendszer 🏷️
- Több címke hozzáadása videókhoz
- Egyéni címke kategóriák létrehozása
- Videók szűrése címkék alapján
- Címke kezelő felület
- Csoportos címke műveletek

#### Keresés és Szűrés 🔍
- Videók keresése név alapján
- Szűrés címkék alapján
- Rendezés különböző kritériumok szerint
- Fejlett szűrési lehetőségek
- Szűrési beállítások mentése

#### Felhasználói Felület 🎨
- Reszponzív dizájn minden eszközre
- Sötét/világos mód támogatás
- Modern, letisztult felület
- Betöltési animációk
- Hibakezelési értesítések

#### Biztonság 🔒
- Privát galériák védelme
- Felhasználói hitelesítés
- Biztonságos videó tárolás
- Védett API végpontok

### Technikai Követelmények
- Node.js 16 vagy újabb
- Modern webböngésző
- Supabase fiók a háttérrendszerhez
- Környezeti változók beállítása

### Telepítés
1. Klónozd a repository-t
2. Telepítsd a függőségeket:
```bash
npm install
```
3. Állítsd be a környezeti változókat a `.env` fájlban:
```
VITE_SUPABASE_URL=supabase_url_cím
VITE_SUPABASE_ANON_KEY=supabase_anon_kulcs
```
4. Fejlesztői szerver indítása:
```bash
npm run dev


**********Step By Step Process to deploy on Netlify***********  :
-> npm run build
-> npm install -g netlify-cli
-> netlify deploy
-> netlify deploy --prod
