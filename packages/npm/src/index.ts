import semver from 'semver';

interface PackageResponse {
  name: string;
  ['dist-tags']: Record<string, string>;
  versions: Record<string, Record<string, unknown>>;
}

// GET /{package}
// Response: https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md
async function getPackage(name: string): Promise<PackageResponse> {
  const url = new URL(name, 'https://registry.npmjs.com');
  const response = await fetch(url);
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }
  const result = await response.text();
  throw new Error(`Received non-200 response with text: ${result}`);
}

interface PackageVersionResponse {
  name: string;
  version: string;
  type?: string;
  main?: string;
  types?: string;
  exports?: string | Record<string, string>;
  dist: {
    integrity: string;
    shasum: string;
    tarball: string;
    fileCount: number;
    unpackedSize: number;
  };
}

// GET /{package}/{version}
async function getPackageVersion(
  name: string,
  version: string,
): Promise<PackageVersionResponse> {
  const url = new URL(`${name}/${version}`, 'https://registry.npmjs.com');
  const response = await fetch(url);
  if (response.status === 200) {
    const json = await response.json();
    return json;
  }
  const result = await response.text();
  throw new Error(`Received non-200 response with text: ${result}`);
}

/**
 * For a given semver range, find the highest version that will satisfy it
 */
async function resolvePackageVersion(name: string, range: string) {
  const info = await getPackage(name);
  const version = semver.maxSatisfying(Object.keys(info.versions), range);
  return version;
}

export { getPackage, getPackageVersion, resolvePackageVersion };
