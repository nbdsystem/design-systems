import adele from './src/adele-dump.json' assert { type: 'json' };
import original from './src/generated/design-systems.json' assert { type: 'json' };
import fs from 'node:fs/promises';
import path from 'node:path';

const result = [];

for (const ds of adele) {
  result.push({
    name: ds.name.trim(),
    sponsor: ds.company.trim(),
    links: ds.links.filter((link) => {
      return link.url
    }),
  });
}

for (const ds of original) {
  result.push({
    name: ds.name.trim(),
    sponsor: ds.company.trim(),
    links: [
      ...ds.links,
      ...ds.sources.filter(source => {
        if (source.type !== 'github') {
          throw new Error('Unknown source type', source);
        }
        return true;
      }).map((source) => {
        return {
          type: 'github',
          url: new URL(`/${source.owner}/${source.name}`, 'https://github.com'),
        }
      })
    ]
  });
}

result.sort((a, b) => {
  return a.name.localeCompare(b.name);
});

await fs.writeFile('data.json', JSON.stringify(result, null, 2));
// console.log(result);

// console.log(adele);
// console.log(original);

