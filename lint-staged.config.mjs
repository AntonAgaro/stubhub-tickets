export default {
  '*.{js,mjs,cjs,ts}': ['eslint --fix', 'prettier --write'],
  '*.{json,jsonc,md,yaml,yml}': 'prettier --write',
};
