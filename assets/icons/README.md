# icons

The app's line icons, drawn from the Pockit design's own SVG geometry. Each is a **white-on-transparent
mask** at 1x, `@2x` and `@3x`; Metro picks the density. The app tints them (`tint-color`), so the
colour in the file does not matter and anything not white would be wrong.

| File | Size at 1x | Used for |
| --- | --- | --- |
| `<name>.png` | 32 pt | In-screen icons (`shared/components/icon`). 32 so the largest use, the empty-state tile, stays sharp; smaller uses scale down. |
| `tab-<name>.png` | 24 pt | The Android tab bar, which expects 24 dp. iOS draws SF Symbols instead (`shell/tabs.ts`). |

Icons: `search`, `chevron-right`, `plus`, `shield`, `heart` (filled), `id-card`, `award`, `flag`,
`camera`, `photos`, `face`, `logo`, and for the tab bar `home`, `layers`, `search`, `sliders`.

## Source

All icons sit on a 24 x 24 grid, round caps and joins. The path data and stroke width are the design's:

| Icon | Stroke | SVG path |
| --- | --- | --- |
| home | 1.75 | `M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z` |
| layers | 1.75 | `M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5` |
| search | 1.75 | `M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3` |
| sliders | 1.75 | `M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4` |
| chevron-right | 2 | `m9 6 6 6-6 6` |
| plus | 2.25 | `M12 5v14M5 12h14` |
| shield | 1.75 | `M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z` |
| id-card | 1.75 | `M3 6h18v12H3zM8 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM14 10h4M14 14h3` |
| award | 1.75 | `M12 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 13.5 7 22l5-3 5 3-1.5-8.5` |
| flag | 1.75 | `M6 3h12v18l-6-4-6 4z` |
| heart | 1.75, filled | `M12 20s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.2-8 11-8 11z` |
| camera | 1.75 | `M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z` |
| photos | 1.75 | `M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21` |
| face | 1.75 | `M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2M9 9v1M15 9v1M12 9v4h-1M9 16c1.5 1.3 4.5 1.3 6 0` |
| logo | 1.75 | `M4 9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM4 12h16M8 7V5h8v2` |

They were rasterised from this data with a throwaway script that is not kept. To add an icon, draw it
to the same convention (or rasterise its path the same way), add the three densities here, then add
its name to `IconName` and its `require` to `shared/components/icon/icon.ts`.
