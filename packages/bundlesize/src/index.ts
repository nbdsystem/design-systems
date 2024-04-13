import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getPackageEntryPoints } from '@nbds/pkg';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import virtual from '@rollup/plugin-virtual';
import { gzipSizeSync } from 'gzip-size';
import { rollup } from 'rollup';
import { minify } from 'terser';

type BundleSize = {
  entrypoint: string;
  pattern?: string;
  relativePath: string;
  conditions: Array<string>;
  moduleFormat: 'module' | 'commonjs';
  gzipUnminified: number;
  gzipMinified: number;
  unminified: number;
  minified: number;
  exports: Array<{
    identifier: string;
    gzipUnminified: number;
    gzipMinified: number;
    unminified: number;
    minified: number;
  }>;
};

export async function bundleSize(
  directory: string,
): Promise<Array<BundleSize>> {
  const packageJsonPath = path.join(directory, 'package.json');
  if (!existsSync(packageJsonPath)) {
    throw new Error(`No package.json found in ${directory}`);
  }

  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
  const entryPoints = getPackageEntryPoints(packageJson);
  const external = [
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
  ].map((name) => {
    return new RegExp(`^${name}(/.*)?`);
  });

  const result: Array<BundleSize> = [];

  for (const entryPoint of entryPoints) {
    if (entryPoint.type === 'EntryPoint') {
      const bundleData = await getBundleSize({
        directory,
        entrypoint: entryPoint.path,
        filepath: path.resolve(directory, entryPoint.filepath),
        conditions: [],
        moduleFormat: entryPoint.packageModuleFormat,
        external,
      });
      result.push(bundleData);
    } else if (entryPoint.type === 'ConditionEntryPoint') {
      if (entryPoint.conditions.includes('types')) {
        continue;
      }

      const filepath = path.resolve(directory, entryPoint.filepath);
      const condition = entryPoint.conditions[entryPoint.conditions.length - 1];
      const moduleFormat =
        condition === 'default'
          ? entryPoint.packageModuleFormat
          : condition === 'import'
            ? 'module'
            : 'commonjs';
      const bundleData = await getBundleSize({
        directory,
        entrypoint: entryPoint.path,
        filepath,
        conditions: entryPoint.conditions,
        moduleFormat,
        external,
      });
      result.push(bundleData);
    } else if (entryPoint.type === 'EntryPointPattern') {
      const files = await listFiles(directory);
      const matches: Array<[string, string]> = [];

      for (const file of files) {
        for (const pattern of entryPoint.patterns) {
          let [start, end] = pattern.split('*');
          if (!start || !end) {
            continue;
          }

          if (start.startsWith('./')) {
            start = start.slice(2);
          }

          const relativePath = path.relative(directory, file);
          if (relativePath.startsWith(start) && relativePath.endsWith(end)) {
            matches.push([file, pattern]);
          }
        }
      }

      for (const [filepath, pattern] of matches) {
        const bundleData = await getBundleSize({
          directory,
          entrypoint: entryPoint.path,
          filepath,
          conditions: [],
          moduleFormat: entryPoint.packageModuleFormat,
          pattern,
          external,
        });
        result.push(bundleData);
      }
    } else if (entryPoint.type === 'ConditionEntryPointPattern') {
      if (entryPoint.conditions.includes('types')) {
        continue;
      }

      const files = await listFiles(directory);
      const matches: Array<[string, string]> = [];

      for (const file of files) {
        for (const pattern of entryPoint.patterns) {
          let [start, end] = pattern.split('*');
          if (!start || !end) {
            continue;
          }

          if (start.startsWith('./')) {
            start = start.slice(2);
          }

          const relativePath = path.relative(directory, file);
          if (relativePath.startsWith(start) && relativePath.endsWith(end)) {
            matches.push([file, pattern]);
          }
        }
      }

      for (const [filepath, pattern] of matches) {
        const condition =
          entryPoint.conditions[entryPoint.conditions.length - 1];
        const moduleFormat =
          condition === 'default'
            ? entryPoint.packageModuleFormat
            : condition === 'import'
              ? 'module'
              : 'commonjs';
        const bundleData = await getBundleSize({
          directory,
          entrypoint: entryPoint.path,
          filepath,
          conditions: entryPoint.conditions,
          moduleFormat,
          pattern,
          external,
        });
        result.push(bundleData);
      }
    }
  }

  return result;
}

async function getBundleSize({
  directory,
  entrypoint,
  filepath,
  pattern,
  moduleFormat,
  conditions,
  external,
}: {
  directory: string;
  entrypoint: BundleSize['entrypoint'];
  filepath: string;
  pattern?: BundleSize['pattern'];
  moduleFormat: BundleSize['moduleFormat'];
  conditions: BundleSize['conditions'];
  external: Array<string | RegExp>;
}): Promise<BundleSize> {
  if (pattern) {
    console.log(
      'Getting bundle data for: %s at %s',
      entrypoint,
      path.relative(directory, filepath),
    );
  } else {
    console.log('Getting bundle data for: %s', entrypoint);
  }

  const bundle = await rollup({
    input: filepath,
    external,
    plugins: [
      nodeResolve(),
      commonjs({
        include: [/node_modules/],
      }),
      json(),
    ],
    onwarn: () => {
      //
    },
  });
  const { output } = await bundle.generate({
    format: 'esm',
  });
  const minified = await minify(output[0].code);
  if (minified.code === undefined) {
    throw new Error('Unable to minify code');
  }

  const exports: BundleSize['exports'] = [];

  for (const identifier of output[0].exports) {
    console.log('Visiting: %s', identifier);
    const reexport = await rollup({
      input: '__entrypoint__',
      external,
      plugins: [
        nodeResolve(),
        commonjs({
          include: /node_modules/,
        }),
        virtual({
          __entrypoint__: `export { ${identifier} } from '${filepath}';`,
        }),
        json(),
      ],
      onwarn: () => {
        //
      },
    });
    const { output } = await reexport.generate({
      format: 'esm',
    });
    const minified = await minify(output[0].code);
    if (minified.code === undefined) {
      throw new Error('Unable to minify code');
    }

    exports.push({
      identifier,
      unminified: Buffer.byteLength(output[0].code),
      minified: Buffer.byteLength(minified.code),
      gzipUnminified: gzipSizeSync(output[0].code),
      gzipMinified: gzipSizeSync(minified.code),
    });
  }

  return {
    entrypoint,
    relativePath: path.relative(directory, filepath),
    pattern,
    moduleFormat,
    conditions,
    unminified: Buffer.byteLength(output[0].code),
    minified: Buffer.byteLength(minified.code),
    gzipUnminified: gzipSizeSync(output[0].code),
    gzipMinified: gzipSizeSync(minified.code),
    exports,
  };
}

async function listFiles(directory: string): Promise<Array<string>> {
  const files = await fs.readdir(directory, { withFileTypes: true });
  const result = await Promise.all(
    files
      .filter((file) => {
        return !file.name.includes('node_modules');
      })
      .map((file) => {
        if (file.isDirectory()) {
          return listFiles(path.join(directory, file.name));
        }
        return path.join(directory, file.name);
      }),
  );

  return result.flat();
}
