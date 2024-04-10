import { z } from 'zod';

// "exports": {
//   "import": "./index.js"
// }
//
// "exports": {
//   "./components/*": {
//     "import": ["./components/*.js", "./components/*/index.js"]
//   }
// }
//
// "exports": {
//   "node": {
//     "import": "./index.js"
//   }
// }
type ExportValue =
  | string
  | Array<string>
  | null
  | { [key: string]: ExportValue };

const ExportValueSchema: z.ZodType<ExportValue> = z.union([
  z.string(),
  z.null(),
  z.array(z.string()),
  z.record(z.string(), z.union([z.lazy(() => ExportValueSchema), z.string()])),
]);

const ExportsSchema = z.union([
  // "exports": "./index.js"
  z.string(),

  // "exports": {}
  z.record(z.string(), ExportValueSchema),
]);

const PackageJsonSchema = z.object({
  name: z.string().optional(),
  type: z.enum(['module', 'commonjs']).optional(),
  main: z.string().optional(),
  module: z.string().optional(),
  exports: ExportsSchema.optional(),
});

type PackageJson = z.infer<typeof PackageJsonSchema>;

type ModuleFormat = 'commonjs' | 'module';

// "exports": "./index.js"
// "exports": {
//   ".": "./index.js"
// }
type EntryPoint = {
  type: 'EntryPoint';
  path: string;
  filepath: string;
  packageModuleFormat: ModuleFormat;
};

// "exports": {
//   "import": "./index.js"
// }
//
// "exports": {
//   ".": {
//     "import": "./index.js"
//   }
// }
type ConditionEntryPoint = {
  type: 'ConditionEntryPoint';
  path: string;
  conditions: Array<ConditionType>;
  filepath: string;
  packageModuleFormat: ModuleFormat;
};

// "exports": {
//   "./components/*": "./src/components/*.js"
// }
//
// "exports": {
//   "./components/*": ["./src/components/*.js", "./src/components/*/index.js]
// }
type EntryPointPattern = {
  type: 'EntryPointPattern';
  path: string;
  patterns: Array<string>;
  packageModuleFormat: ModuleFormat;
};

// "exports": {
//   "./components/*": {
//     "import": "./src/components/*.js"
//   }
// }
//
// "exports": {
//   "./components/*": {
//     "import": ["./src/components/*.js"]
//   }
// }
type ConditionEntryPointPattern = {
  type: 'ConditionEntryPointPattern';
  path: string;
  conditions: Array<ConditionType>;
  patterns: Array<string>;
  packageModuleFormat: ModuleFormat;
};

type ConditionType =
  | 'node-addons'
  | 'node'
  | 'import'
  | 'require'
  | 'default'
  | 'types'
  | string;

export type PackageEntryPoint =
  | EntryPoint
  | ConditionEntryPoint
  | EntryPointPattern
  | ConditionEntryPointPattern;

/**
 * @see https://nodejs.org/api/packages.html#package-entry-points
 */
export function getPackageEntryPoints(
  contents: unknown,
): Array<PackageEntryPoint> {
  const packageJson: PackageJson = PackageJsonSchema.parse(contents);
  const packageModuleFormat = packageJson.type ?? 'commonjs';

  if (packageJson.exports) {
    if (typeof packageJson.exports === 'string') {
      return [
        {
          type: 'EntryPoint',
          path: '.',
          filepath: packageJson.exports,
          packageModuleFormat,
        },
      ];
    }

    return Array.from(dfs(packageJson.exports)).flatMap(([path, value]) => {
      const [first, ...conditions] = path;
      if (!first) {
        return [];
      }

      // Subpath exports
      if (first.startsWith('.')) {
        // Pattern
        if (first.includes('*')) {
          if (path.length === 1) {
            return {
              type: 'EntryPointPattern',
              patterns: Array.isArray(value) ? value : [value],
              path: first,
              packageModuleFormat,
            };
          }

          return {
            type: 'ConditionEntryPointPattern',
            patterns: Array.isArray(value) ? value : [value],
            conditions,
            path: first,
            packageModuleFormat,
          };
        }

        if (Array.isArray(value)) {
          throw new Error('Unexpected array pattern in subpath export');
        }

        // No conditions
        // "exports": {
        //   ".": "./index.js"
        // }
        if (path.length === 1) {
          return {
            type: 'EntryPoint',
            path: first,
            filepath: value,
            packageModuleFormat,
          };
        }

        // With conditions
        // "exports": {
        //   ".": {
        //     "import": "./index.js"
        //   }
        // }
        return {
          type: 'ConditionEntryPoint',
          path: first,
          conditions,
          filepath: value,
          packageModuleFormat,
        };
      }

      // Condition
      // "exports": {
      //   "import": "./index.js"
      // }

      if (Array.isArray(value)) {
        throw new Error('Unexpected array value for condition entry point');
      }

      return {
        type: 'ConditionEntryPoint',
        path: '.',
        conditions: [first, ...conditions],
        filepath: value,
        packageModuleFormat,
      };
    });
  }

  if (packageJson.module) {
    return [
      {
        type: 'EntryPoint',
        packageModuleFormat: 'module',
        path: '.',
        filepath: packageJson.module,
      },
    ];
  }

  if (packageJson.main) {
    return [
      {
        type: 'EntryPoint',
        packageModuleFormat,
        path: '.',
        filepath: packageJson.main,
      },
    ];
  }

  return [];
}

type PackageExports = {
  [Key: string]: string | Array<string> | null | PackageExports;
};

function* dfs(
  exports: PackageExports,
  path: Array<string> = [],
): Generator<[Array<string>, string | Array<string>]> {
  for (const [key, value] of Object.entries(exports)) {
    if (value === null) {
      continue;
    } else if (typeof value === 'string') {
      yield [[...path, key], value];
    } else if (Array.isArray(value)) {
      yield [[...path, key], value];
    } else if (typeof value === 'object') {
      yield* dfs(value, [...path, key]);
    }
  }
}
