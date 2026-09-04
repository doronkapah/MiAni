/**
 * בדיקה אם המשחק מוגש מהשרת המקומי, ואם יש בו מפתח API.
 *
 * באירוח סטטי הקריאה הזאת פשוט נכשלת, וזה המצב התקין —
 * אז המשתמש מכניס מפתח משלו בלוח ההורים.
 */

export interface ServerInfo {
  available: boolean;
  serverKey: boolean;
}

let cached: ServerInfo | null = null;

export async function probeServer(): Promise<ServerInfo> {
  if (cached) return cached;
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}api/config`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!response.ok) throw new Error("no server");
    const data = (await response.json()) as { serverKey?: boolean };
    cached = { available: true, serverKey: Boolean(data.serverKey) };
  } catch {
    cached = { available: false, serverKey: false };
  }
  return cached;
}
