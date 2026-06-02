import { auth } from '@/lib/firebase';

export type SummaryRecord = {
  id: string;
  name: string;
  email: string;
  team: string;
  imageUrl: string;
  certificateGenerated: boolean;
};

/**
 * Fetches the summary from the Cloud Function.
 * Returns an object { totalSubmissions: number, submissions: SummaryRecord[] }
 */
export const fetchSummary = async (): Promise<{ totalSubmissions: number; submissions: SummaryRecord[] }> => {
  const token = await auth.currentUser?.getIdToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const resp = await fetch('https://us-central1-gen-lang-client-0544511943.cloudfunctions.net/summary', {
    method: 'GET',
    headers,
  });

  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.error || 'Failed to fetch summary');
  }
  return await resp.json();
};

/**
 * Uploads a file to Backblaze B2 via the secure Cloud Function bridge
 */
export const uploadFileToB2 = async (file: File | Blob, fileName: string): Promise<string> => {
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const resp = await fetch('https://us-central1-gen-lang-client-0544511943.cloudfunctions.net/uploadToB2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base64Data,
      fileName,
      contentType: file.type,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(err || 'Failed to upload to B2');
  }

  const json = await resp.json();
  return json.url;
};
