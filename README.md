[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/binasalama12/makefun-best-game-01-w4/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/binasalama12/makefun-best-game-01-w4/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# Cinder Knight

A 2D canvas auto-runner. A knight of embers sprints on his own through the
ruins of a burning castle at dusk — your job is only to jump. Leap the gaps,
double-jump the wide ones, dodge spikes and bats, and gather glowing embers
for score while a wall of lava chases you from behind. Falling, spikes, bats
or the lava each cost one of your three shields; lose them all and the ember
falls. Reach the glowing gate to clear the stage — every next stage runs
faster and the dusk grows darker.

Built with plain HTML, canvas and ES modules — no libraries, no build step,
no network. Sound is synthesized live with WebAudio. Levels are generated
procedurally from a deterministic seed (mulberry32), physics runs on a fixed
timestep, and a shot mode (`?shot=title|play|feature|end&seed=N`) renders any
scene as a single deterministic frame.

## Controls

- **Space / W / ↑ / Click / Tap** — jump; press again in mid-air to double-jump
- **Enter** — start from the title screen
- **P** — pause / resume
- **R** — restart after game over
- **M** — mute / unmute

Score = distance run + 25 per ember. The end screen shows the stage you
reached and your final score.

## How to run

Open `game/index.html` in a desktop browser, or serve the folder:

```sh
python3 -m http.server --directory game 8080
# then open http://localhost:8080
```

To hand the entry in (copies `game/` and `screenshots/` and writes the
dossier the judge reads):

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Screenshots

- `screenshots/1-title.jpg` — title over the dusk castle
- `screenshots/2-play.jpg` — mid-stage run with HUD
- `screenshots/3-feature.jpg` — a double-jump over a gap, lava closing in
- `screenshots/4-end.jpg` — game-over results

## License

MIT — see `LICENSE`.
