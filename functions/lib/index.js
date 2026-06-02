"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToB2 = exports.summary = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const client_s3_1 = require("@aws-sdk/client-s3");
const cors_1 = __importDefault(require("cors"));
const corsHandler = (0, cors_1.default)({ origin: true });
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
exports.summary = functions
    .region('us-central1') // change if you need a different region
    .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        // ----- OPTIONAL AUTH CHECK -----
        const authHeader = req.get('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const idToken = authHeader.split('Bearer ')[1];
            try {
                await admin.auth().verifyIdToken(idToken);
            }
            catch (e) {
                console.warn('Invalid ID token', e);
                res.status(401).json({ error: 'Invalid ID token' });
                return;
            }
        }
        else {
            // If you want the endpoint public, comment out the block above and this `else`.
            res.status(401).json({ error: 'Missing Authorization header' });
            return;
        }
        try {
            const snapshot = await db.collection('certificates').get();
            const total = snapshot.size;
            const records = snapshot.docs.map(doc => {
                const data = doc.data();
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
        }
        catch (err) {
            console.error('Error reading certificates', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
});
// --- Backblaze B2 Configuration ---
const s3Client = new client_s3_1.S3Client({
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
exports.uploadToB2 = functions
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
            const command = new client_s3_1.PutObjectCommand({
                Bucket: B2_BUCKET_NAME,
                Key: fileName,
                Body: buffer,
                ContentType: contentType || 'application/octet-stream',
            });
            await s3Client.send(command);
            // Construct the public URL
            const publicUrl = `https://${B2_BUCKET_NAME}.s3.us-east-005.backblazeb2.com/${fileName}`;
            res.status(200).json({ url: publicUrl });
        }
        catch (error) {
            console.error('B2 Upload Error:', error);
            res.status(500).json({ error: error.message });
        }
    });
});
