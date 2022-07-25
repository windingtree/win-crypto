export const escapeError = (message: string) => message.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&');
