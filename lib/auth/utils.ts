
export function isSafeRedirect(path: string): boolean {
  // Only allow relative paths starting with /, reject protocol-relative // and external schemes
  return path.startsWith('/') && !path.startsWith('//');
}
