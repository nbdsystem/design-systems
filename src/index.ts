import { z } from 'zod';
import data from './generated/design-systems.json';
import { designSystem } from './schemas/design-system';

export type DesignSystem = z.infer<typeof designSystem>;
export const designSystems = data as Array<DesignSystem>;
