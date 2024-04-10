import { describe, expect, test } from 'vitest';
import { getPackageEntryPoints } from '../';

describe('getPackageEntryPoints', () => {
  test('no entry points', () => {
    expect(getPackageEntryPoints(JSON.parse(`{}`))).toEqual([]);
  });

  test('package uses main as main entry point', () => {
    expect(
      getPackageEntryPoints(
        JSON.parse(`
          {
            "main": "dist/index.js"
          }
        `),
      ),
    ).toEqual([
      {
        type: 'EntryPoint',
        path: '.',
        filepath: 'dist/index.js',
        packageModuleFormat: 'commonjs',
      },
    ]);
  });

  test('package uses exports as main entry point', () => {
    expect(
      getPackageEntryPoints(
        JSON.parse(`
          {
            "exports": "dist/index.js"
          }
        `),
      ),
    ).toEqual([
      {
        type: 'EntryPoint',
        path: '.',
        filepath: 'dist/index.js',
        packageModuleFormat: 'commonjs',
      },
    ]);
  });

  test('prefer exports over main as main entry point', () => {
    expect(
      getPackageEntryPoints(
        JSON.parse(`
          {
            "main": "dist/index.js",
            "exports": "dist/exports/index.js"
          }
        `),
      ),
    ).toEqual([
      {
        type: 'EntryPoint',
        path: '.',
        filepath: 'dist/exports/index.js',
        packageModuleFormat: 'commonjs',
      },
    ]);
  });

  test('exports as main entry point uses package type as module format', () => {
    expect(
      getPackageEntryPoints(
        JSON.parse(`
          {
            "type": "module",
            "exports": "dist/index.js"
          }
        `),
      ),
    ).toEqual([
      {
        type: 'EntryPoint',
        path: '.',
        filepath: 'dist/index.js',
        packageModuleFormat: 'module',
      },
    ]);
  });

  test('subpaths with string values', () => {
    expect(
      getPackageEntryPoints(
        JSON.parse(`
          {
            "type": "module",
            "exports": {
              ".": "dist/index.js",
              "./components": "dist/components/index.js"
            }
          }
        `),
      ),
    ).toEqual([
      {
        type: 'EntryPoint',
        path: '.',
        filepath: 'dist/index.js',
        packageModuleFormat: 'module',
      },
      {
        type: 'EntryPoint',
        path: './components',
        filepath: 'dist/components/index.js',
        packageModuleFormat: 'module',
      },
    ]);
  });

  test('subpaths with conditions', () => {
    expect(
      getPackageEntryPoints(
        JSON.parse(`
          {
            "type": "module",
            "exports": {
              ".": {
                "import": "dist/esm/index.js",
                "require": "dist/cjs/index.js"
              },
              "./components": "dist/components/index.js"
            }
          }
        `),
      ),
    ).toEqual([
      {
        type: 'ConditionEntryPoint',
        path: '.',
        conditions: ['import'],
        packageModuleFormat: 'module',
        filepath: 'dist/esm/index.js',
      },
      {
        type: 'ConditionEntryPoint',
        path: '.',
        conditions: ['require'],
        packageModuleFormat: 'module',
        filepath: 'dist/cjs/index.js',
      },
      {
        type: 'EntryPoint',
        path: './components',
        filepath: 'dist/components/index.js',
        packageModuleFormat: 'module',
      },
    ]);
  });

  test('subpaths with nested conditions', () => {
    expect(
      getPackageEntryPoints(
        JSON.parse(`
          {
            "type": "module",
            "exports": {
              ".": {
                "node": {
                  "import": "dist/esm/index.js",
                  "require": "dist/cjs/index.js"
                }
              },
              "./components": "dist/components/index.js"
            }
          }
        `),
      ),
    ).toEqual([
      {
        type: 'ConditionEntryPoint',
        path: '.',
        conditions: ['node', 'import'],
        packageModuleFormat: 'module',
        filepath: 'dist/esm/index.js',
      },
      {
        type: 'ConditionEntryPoint',
        path: '.',
        conditions: ['node', 'require'],
        packageModuleFormat: 'module',
        filepath: 'dist/cjs/index.js',
      },
      {
        type: 'EntryPoint',
        path: './components',
        filepath: 'dist/components/index.js',
        packageModuleFormat: 'module',
      },
    ]);
  });

  test('subpath with pattern', () => {
    expect(
      getPackageEntryPoints(
        JSON.parse(`
          {
            "type": "module",
            "exports": {
              "./components/*": "./dist/components/*.js"
            }
          }
        `),
      ),
    ).toEqual([
      {
        type: 'EntryPointPattern',
        path: './components/*',
        patterns: ['./dist/components/*.js'],
        packageModuleFormat: 'module',
      },
    ]);
  });

  test('subpath with patterns', () => {
    expect(
      getPackageEntryPoints(
        JSON.parse(`
          {
            "type": "module",
            "exports": {
              "./components/*": ["./dist/components/*.js", "./dist/components/*/index.js"]
            }
          }
        `),
      ),
    ).toEqual([
      {
        type: 'EntryPointPattern',
        path: './components/*',
        patterns: ['./dist/components/*.js', './dist/components/*/index.js'],
        packageModuleFormat: 'module',
      },
    ]);
  });

  test('subpath with condition and pattern', () => {
    expect(
      getPackageEntryPoints(
        JSON.parse(`
          {
            "type": "module",
            "exports": {
              "./components/*": {
                "import": "./dist/components/*.js",
                "require": "./dist/cjs/components/*.js"
              }
            }
          }
        `),
      ),
    ).toEqual([
      {
        type: 'ConditionEntryPointPattern',
        path: './components/*',
        conditions: ['import'],
        packageModuleFormat: 'module',
        patterns: ['./dist/components/*.js'],
      },
      {
        type: 'ConditionEntryPointPattern',
        path: './components/*',
        conditions: ['require'],
        packageModuleFormat: 'module',
        patterns: ['./dist/cjs/components/*.js'],
      },
    ]);
  });

  test('subpath with condition and patterns', () => {
    expect(
      getPackageEntryPoints(
        JSON.parse(`
          {
            "type": "module",
            "exports": {
              "./components/*": {
                "import": ["./dist/components/*.js", "./dist/components/*/index.js"],
                "require": ["./dist/cjs/components/*.js", "./dist/cjs/components/*/index.js"]
              }
            }
          }
        `),
      ),
    ).toEqual([
      {
        type: 'ConditionEntryPointPattern',
        path: './components/*',
        conditions: ['import'],
        packageModuleFormat: 'module',
        patterns: ['./dist/components/*.js', './dist/components/*/index.js'],
      },
      {
        type: 'ConditionEntryPointPattern',
        path: './components/*',
        conditions: ['require'],
        packageModuleFormat: 'module',
        patterns: [
          './dist/cjs/components/*.js',
          './dist/cjs/components/*/index.js',
        ],
      },
    ]);
  });
});
