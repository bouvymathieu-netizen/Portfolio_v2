import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

const SRC = 'backstage-src';
const OUT = 'assets/backstage';
const FULL_W = 1600;

async function main() {
  const srcDir = path.join(process.cwd(), SRC);
  let files = [];
  try {
    files = (await fs.readdir(srcDir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  } catch {
    console.log(`Dossier "${SRC}/" introuvable. Crée-le et déposes-y tes backstages.`);
    return;
  }
  if (!files.length) {
    console.log(`Aucune image dans "${SRC}/". Ajoute des backstages puis relance : npm run backstage`);
    return;
  }
  await fs.mkdir(OUT, { recursive: true });
  let n = 0;
  for (const f of files.sort()) {
    const id = f
      .replace(/\.[^.]+$/, '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '');
    await sharp(path.join(srcDir, f)).rotate().resize(FULL_W).webp({ quality: 82 }).toFile(path.join(OUT, `${id}.webp`));
    n++;
  }
  console.log(`OK — ${n} backstage(s) optimisé(s) vers ${OUT}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
