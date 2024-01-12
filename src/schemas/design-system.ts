import Joi from 'joi';

const link = Joi.object({
  url: Joi.string().required(),
  type: Joi.string().valid('website', 'storybook'),
});

const pkg = Joi.object({
  registry: Joi.string().valid('npm').required(),
  package: Joi.string().required(),
});

const source = Joi.object({
  name: Joi.string().required(),
  owner: Joi.string().required(),
  type: Joi.string().valid('github').required(),
});

export const designSystem = Joi.object({
  name: Joi.string().required(),
  company: Joi.string().required(),
  links: Joi.array().items(link).required(),
  sources: Joi.array().items(source),
  packages: Joi.array().items(pkg).required(),
});
