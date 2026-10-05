// Writes src/app/shared/theme/global.css from theme.ts. Run it with `npm run theme` after a change
// to the theme. Node strips the types itself (22.18 or newer), so there is nothing to install.
import { writeFileSync } from 'node:fs';
import { buildGlobalCss } from '../src/app/shared/theme/theme-css.ts';

const target = new URL('../src/app/shared/theme/global.css', import.meta.url);
writeFileSync(target, buildGlobalCss());
console.log(`wrote ${target.pathname.split('/').slice(-5).join('/')}`);
