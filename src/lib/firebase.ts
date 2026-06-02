import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// This was populated after Firebase setup
const firebaseConfig = {
  projectId: "gen-lang-client-0544511943",
  appId: "1:1009338488925:web:7bde147918200fb70795b4",
  apiKey: "AIzaSyAr1JJcNGYxFfmEYeetwuuso7RYbINTiRU",
  authDomain: "gen-lang-client-0544511943.firebaseapp.com",
  storageBucket: "gen-lang-client-0544511943.firebasestorage.app",
  messagingSenderId: "1009338488925",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-015ce822-c939-4b13-829a-60b606a833d0");

// --- Backblaze B2 Configuration (Direct Browser Upload) ---
const s3Client = new S3Client({
  endpoint: 'https://s3.us-east-005.backblazeb2.com',
  region: 'us-east-005',
  credentials: {
    accessKeyId: '2f76c343cb83',
    secretAccessKey: '0052f76c343cb830000000001',
  },
});

const B2_BUCKET_NAME = 'insta360app';

// Helper to upload any File/Blob (image or pdf).
// Primary: Firebase Storage (recommended for browser uploads).
// Fallback: Backblaze B2 via S3 client (existing code).
export const uploadFile = async (file: File | Blob, uid: string, folder: string = 'certificates', onProgress?: (pct: number) => void) => {
  const timestamp = Date.now();
  const originalName = (file instanceof File ? file.name : `file_${timestamp}`);
  const fileName = `${folder}/${uid}/${timestamp}_${originalName}`;

  // Try Firebase Storage first
  try {
    const storage = getStorage(app);
    const ref = storageRef(storage, fileName);
    // Ensure we have a Blob
    const data = file instanceof Blob ? file : new Blob([file]);
    const uploadTask = uploadBytesResumable(ref, data, { contentType: (file as File).type || 'application/octet-stream' });
    // attach progress listener if provided
    if (onProgress) {
      uploadTask.on('state_changed', (snapshot) => {
        const pct = snapshot.totalBytes ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100) : 0;
        onProgress(pct);
      });
    }
    // wait for completion
    await uploadTask;
    const url = await getDownloadURL(ref);
    if (onProgress) onProgress(100);
    return url;
  } catch (fbErr: any) {
    console.warn('Firebase upload failed, attempting Backblaze B2 fallback:', fbErr?.message || fbErr);
    // Continue to fallback
  }

  // Fallback to Backblaze B2 via S3 client
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileName,
      Body: uint8Array,
      ContentType: (file as File).type || 'application/octet-stream',
    });

    await s3Client.send(command);

    // Return the public URL
    return `https://${B2_BUCKET_NAME}.s3.us-east-005.backblazeb2.com/${fileName}`;
  } catch (error: any) {
    console.error('B2 Direct Upload Error:', error);
    throw new Error(`Upload failed: ${error?.message || error}`);
  }
};

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error.message?.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or network status.");
    }
  }
}

testConnection();
