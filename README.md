# Mini Football (Browser)

A lightweight browser-based football (soccer-like) mini-game added to the repo, now with Career Mode, full player avatars and touch controls.

How to run
1. Open index.html in a browser (no server required).
   - Double-click index.html or serve with a simple static server (e.g., `python -m http.server`).
2. Use controls:
   - Left player: W (up), S (down) or on-screen ▲/▼ on mobile
   - Right player: ArrowUp, ArrowDown or on-screen ▲/▼ on mobile
   - D (or on-screen KICK) : special kick (when close to the ball)
   - Space: pause/resume
   - R: reset scores

What I added
- Improved player avatars (full-body cartoonish players) for left and right paddles.
- On-screen touch controls for mobile (left/right ▲/▼ and KICK buttons). Controls appear automatically on small screens.
- Special kick action works via the on-screen KICK button as well.

Notes
- Touch controls use pointer events and work for both touch and mouse.
- If you want multi-touch gestures (drag the paddle), I can add drag-to-move behavior next.

The changes are on the add-football-game branch. If you want further tweaks, for example draggable touch paddle movement, different artwork, or multi-touch friendly layout, tell me which and I will update it.
