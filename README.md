# Mini Football (Browser)

A lightweight browser-based football (soccer-like) mini-game added to the repo, now with Career Mode.

How to run
1. Open index.html in a browser (no server required).
   - Double-click index.html or serve with a simple static server (e.g., `python -m http.server`).
2. Use keys:
   - Left player: W (up), S (down)
   - Right player: ArrowUp, ArrowDown
   - Space: pause/resume
   - R: reset scores

What I added
- Simple canvas-based field and ball physics.
- Two-player local controls for competitive play.
- Score tracking and restart.
- Career Mode (new):
  - Persistent career save in localStorage.
  - Play timed matches (default 60s) and earn XP/coins.
  - Spend XP on upgrades: paddle size, movement speed, and kick power.
  - Season / match progression tracked (simple W/D/L and matches played).

Career Mode details
- Open Career Mode from the main screen.
- Create a new career or continue a saved one.
- Play matches in career mode (you control left player), earn XP and coins based on match results, then use XP to buy upgrades that improve your paddle and kicks.
- Progress is saved automatically when you save from the career screen or when you leave the page.

Next improvements you can ask for
- Tournaments / league table and opponent variety
- Visuals for upgrades and player names
- Rewards, achievements and a simple shop UI for cosmetic items
- More advanced AI difficulty scaling and matchmaking

If everything looks good I already pushed these changes to the add-football-game branch. You can review and request tweaks.
