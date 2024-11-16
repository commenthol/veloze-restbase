/**
 * Escape a string for using as regular expression
 * @example
 * escapeRegExp('($^|^$)')
 * //> '\\(\\$\\^\\|\\^\\$\\)'
 */
export const escapeRegExp = (string) =>
  string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')

export const escapeLike = (string) => string.replace(/%/g, '\\$&')
