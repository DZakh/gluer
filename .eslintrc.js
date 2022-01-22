module.exports = {
  extends: ['airbnb-base', 'prettier'],
  root: true,
  rules: {
    // On the contrary, we prefer named exports
    'import/prefer-default-export': 'off',
    // We use only arrow functions for consistency
    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    // Avoid implicitly returned values
    'arrow-body-style': ['error', 'always'],
  },
};
