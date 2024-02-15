import { z } from 'zod';

const link = z.object({
  url: z.string(),
  type: z.enum(['website', 'storybook']),
});

const pkg = z.object({
  registry: z.enum(['npm']),
  package: z.string(),
});

const source = z.object({
  name: z.string(),
  owner: z.string(),
  type: z.enum(['github']),
});

export const designSystem = z.object({
  name: z.string(),
  company: z.string(),
  links: z.array(link),
  sources: z.array(source),
  packages: z.array(pkg),
});
