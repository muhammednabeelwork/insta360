import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import cors from 'cors';

const corsHandler = cors({ origin: true });

// Initialize the Admin SDK (singleton per container)
admin.initializeApp();
const db = admin.firestore();

/**
 * GET /summary
 * Returns a concise summary of certificate submissions:
 *   - person name, email, team name, image URL
 *   - whether a certificate was generated (true/false)
 *   - total number of submissions
 */
export const summary = functions
  .region('us-central1') // change if you need a different region
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      // ----- OPTIONAL AUTH CHECK -----
      const authHeader = req.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        try {
          await admin.auth().verifyIdToken(idToken);
        } catch (e) {
          console.warn('Invalid ID token', e);
          res.status(401).json({ error: 'Invalid ID token' });
          return;
        }
      } else {
        // If you want the endpoint public, comment out the block above and this `else`.
        res.status(401).json({ error: 'Missing Authorization header' });
        return;
      }

      try {
        const snapshot = await db.collection('certificates').get();
        const total = snapshot.size;
        const records = snapshot.docs.map(doc => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            name: data.userName ?? '',
            email: data.userEmail ?? '',
            team: data.teamName ?? '',
            imageUrl: data.imageUrl ?? '',
            certificateGenerated: !!data.certificateUrl,
          };
        });

        res.status(200).json({ totalSubmissions: total, submissions: records });
      } catch (err) {
        console.error('Error reading certificates', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

// --- Backblaze B2 Configuration ---
const s3Client = new S3Client({
  endpoint: 'https://s3.us-east-005.backblazeb2.com',
  region: 'us-east-005', // Must match the endpoint region
  credentials: {
    accessKeyId: '2f76c343cb83',
    secretAccessKey: '0052f76c343cb830000000001',
  },
});

const B2_BUCKET_NAME = 'insta360app';

/**
 * POST /uploadToB2
 * Securely uploads a base64 encoded file to Backblaze B2
 */
export const uploadToB2 = functions
  .region('us-central1')
  .runWith({ timeoutSeconds: 300, memory: '1GB' })
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const { base64Data, fileName, contentType } = req.body;

      if (!base64Data || !fileName) {
        res.status(400).send('Missing file data or name');
        return;
      }

      try {
        // Decode base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64');

        const command = new PutObjectCommand({
          Bucket: B2_BUCKET_NAME,
          Key: fileName,
          Body: buffer,
          ContentType: contentType || 'application/octet-stream',
        });

        await s3Client.send(command);

        // Construct the public URL
        const publicUrl = `https://${B2_BUCKET_NAME}.s3.us-east-005.backblazeb2.com/${fileName}`;

        res.status(200).json({ url: publicUrl });
      } catch (error: any) {
        console.error('B2 Upload Error:', error);
        res.status(500).json({ error: error.message });
      }
    });
  });
