export function accountReturnUrl(url: string | null): string {
  if (!url?.startsWith('/') || url.startsWith('//') || url.includes('\\')) return '/';
  const path = url.split(/[?#]/)[0];
  return path === '/login' || path === '/signup' ? '/' : url;
}
