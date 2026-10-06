export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function handle(res: Response) {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // response wasn't JSON
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function getFamilies() {
  return handle(await fetch(`${API_URL}/families`, { cache: "no-store" }));
}

export async function getFamilyStatus(familyId: string) {
  return handle(await fetch(`${API_URL}/families/${familyId}/status`, { cache: "no-store" }));
}

export async function uploadSlip(familyId: string, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return handle(await fetch(`${API_URL}/families/${familyId}/upload-slip`, { method: "POST", body: fd }));
}

export async function reloadRecipients() {
  return handle(await fetch(`${API_URL}/reload-recipients`, { method: "POST" }));
}

export async function sendTestSms(phone: string, message: string) {
  const fd = new FormData();
  fd.append("phone", phone);
  fd.append("message", message);
  return handle(await fetch(`${API_URL}/test-sms`, { method: "POST", body: fd }));
}

export async function runSweepNow(familyId: string) {
  return handle(await fetch(`${API_URL}/families/${familyId}/run-sweep-now`, { method: "POST" }));
}

export function familyEventsUrl(familyId: string) {
  return `${API_URL}/families/${familyId}/events`;
}
