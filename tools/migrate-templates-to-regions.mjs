import { ClassicLevel } from 'classic-level';
const db = new ClassicLevel('./db-v14', { valueEncoding: 'json' });
await db.open();

let converted = 0, scenesTouched = 0, templatesDropped = 0;

for await (const [key, adv] of db.iterator()) {
  if (!key.startsWith('!adventures')) continue;
  let dirty = false;

  for (const scene of adv.scenes || []) {
    const templates = scene.templates;
    if (!Array.isArray(templates) || templates.length === 0) {
      // v14 has no Scene#templates field at all - strip the empty array too.
      if ('templates' in scene) { delete scene.templates; dirty = true; }
      continue;
    }
    scenesTouched++;
    scene.regions ??= [];

    for (const t of templates) {
      // px-per-unit = grid.size / grid.distance   (200px per 5ft here)
      const pxPerUnit = scene.grid.size / scene.grid.distance;
      let shape;
      if (t.t === 'circle') {
        const r = t.distance * pxPerUnit;
        shape = { type: 'ellipse', x: t.x, y: t.y, radiusX: r, radiusY: r,
                  rotation: 0, hole: false };
      } else {
        console.warn(`!! unhandled template type "${t.t}" in scene ${scene.name} - left unconverted`);
        templatesDropped++;
        continue;
      }

      adv.scenes.find(s => s === scene).regions.push({
        name: 'Smoky Area',
        _id: t._id,                               // reuse id: traceable, no collision
        color: t.fillColor || '#969696',
        shapes: [shape],
        elevation: { bottom: null, top: null },
        behaviors: [],
        visibility: 0,                            // LAYER - matches the old hidden:true
        locked: false,
        flags: t.flags || {}
      });
      converted++;
    }
    delete scene.templates;
    dirty = true;
  }

  if (dirty) await db.put(key, adv);
}

await db.close();
console.log(`Converted MeasuredTemplates -> Regions: ${converted}`);
console.log(`Scenes modified: ${scenesTouched}`);
console.log(`Unhandled templates: ${templatesDropped}`);
