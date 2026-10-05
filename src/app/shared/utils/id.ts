/** A fresh id: good enough that two of anything made moments apart never collide. */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
