/**
 * Safe link opener helper that works within iframe sandboxes and avoids window.open errors.
 */
export function safeOpenUrl(url: string, target = '_blank'): void {
  try {
    if (typeof window === 'undefined') return;
    const a = document.createElement('a');
    a.href = url;
    a.target = target;
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 100);
  } catch (err) {
    console.warn('[DABIN] Safe navigation fallback:', err);
    try {
      window.location.assign(url);
    } catch {
      // Ignored
    }
  }
}
