# Kawsay logo

An avocado cut in half whose pit is a gauge: the app's zones (coral · amber · blue · amber · coral, `docs/design/tokens.md`)
with the needle in range. The palta is everyday Peruvian food; the dial is "measured eating" (ADR 0027 gauges).

| File                                              | Use                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `kawsay-logo.svg`                                 | Master: icon over the Amanecer gradient (`assets/icon.png`, favicon)     |
| `kawsay-mark.svg`                                 | Avocado alone, transparent (`assets/splash-icon.png`, README, portfolio) |
| `kawsay-foreground.svg` · `kawsay-background.svg` | Android adaptive icon, inside the 66% safe zone                          |
| `kawsay-monochrome.svg`                           | Android 13+ themed icon                                                  |

PNGs are rendered from these SVGs with headless Chrome. The launcher icon and splash change only with a new APK
(native resources); an over-the-air update does not carry them (ADR 0010).
