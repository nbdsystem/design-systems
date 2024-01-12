import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const ROOT_DIR = path.resolve(import.meta.dirname!, '..');
const DESIGN_SYSTEMS_DIR = path.join(ROOT_DIR, 'design-systems');
const designSystems = fs.readdirSync(DESIGN_SYSTEMS_DIR).map((name) => {
  const filepath = path.join(DESIGN_SYSTEMS_DIR, name);
  const contents = yaml.load(fs.readFileSync(filepath, 'utf8'));
  return contents;
});

fs.writeFileSync(
  path.join(ROOT_DIR, 'src', 'generated', 'design-systems.json'),
  JSON.stringify(designSystems, null, 2),
);
