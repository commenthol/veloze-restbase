
export const camelToDash = (str) => String(str || '').replace(/[A-Z]/, (m) => '-' + m.toLowerCase())
