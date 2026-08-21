import { promises as fs } from 'fs';
import path from 'path';
import sharp from 'sharp';

const SRC = 'to add';
const OUT = 'assets/gallery';
const THUMB_W = 640;
const FULL_W = 2048;

function toId(f) {
  return f
    .replace(/\.[^.]+$/, '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  const cwd = process.cwd();
  const srcDir = path.join(cwd, SRC);

  // 1. Charger les photos déjà publiées (pour les conserver)
  let existing = [];
  try {
    existing = JSON.parse(await fs.readFile(path.join(OUT, 'photos.json'), 'utf8'));
  } catch {
    existing = [];
  }

  // 2. Lire les fichiers à ajouter
  let files = [];
  try {
    files = (await fs.readdir(srcDir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  } catch {
    console.log(`Dossier "${SRC}/" introuvable. Crée-le et déposes-y tes photos.`);
    return;
  }

  if (!files.length) {
    console.log(`Aucune nouvelle image dans "${SRC}/". Ajoute des photos puis relance : npm run photos`);
    return;
  }

  await fs.mkdir(path.join(OUT, 'thumb'), { recursive: true });
  await fs.mkdir(path.join(OUT, 'full'), { recursive: true });

  // 3. Traiter les nouvelles photos
  const newPhotos = [];
  for (const f of files.sort()) {
    const id = toId(f);
    const input = path.join(srcDir, f);
    const meta = await sharp(input).metadata();
    if (!meta.width || !meta.height) continue;

    await sharp(input).rotate().resize(THUMB_W).webp({ quality: 78 }).toFile(path.join(OUT, 'thumb', `${id}.webp`));
    await sharp(input).rotate().resize(FULL_W).webp({ quality: 82 }).toFile(path.join(OUT, 'full', `${id}.webp`));

    newPhotos.push({
      id,
      title: f.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
      thumb: `assets/gallery/thumb/${id}.webp`,
      full: `assets/gallery/full/${id}.webp`,
      width: meta.width,
      height: meta.height,
      aspect: Number((meta.width / meta.height).toFixed(3)),
    });
  }

  // 4. Fusionner (une nouvelle photo écrase une ancienne portant le même id)
  const map = new Map();
  for (const p of existing) map.set(p.id, p);
  for (const p of newPhotos) map.set(p.id, p);
  const merged = Array.from(map.values());

  await fs.writeFile(path.join(OUT, 'photos.json'), JSON.stringify(merged, null, 2));
  console.log(`OK — ${newPhotos.length} photo(s) ajoutée(s). Galerie : ${merged.length} photo(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
