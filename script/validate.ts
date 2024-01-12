import fs from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { designSystem } from '../src/schemas/design-system';

const ROOT_DIR = path.resolve(import.meta.dirname!, '..');
const DESIGN_SYSTEMS_DIR = path.join(ROOT_DIR, 'design-systems');
const designSystems = await fs.readdir(DESIGN_SYSTEMS_DIR).then((names) => {
  return names.map((name) => {
    return path.join(DESIGN_SYSTEMS_DIR, name);
  });
});

for (const filepath of designSystems) {
  const contents = yaml.load(await fs.readFile(filepath, 'utf8'));
  designSystem.parse(contents);
}
