import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Increase payload limit for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Cloud credentials configured with provided Appwrite key
const CLOUD_ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const CLOUD_PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '6a9b9f2a00110d93d685';
const CLOUD_API_KEY =
  process.env.APPWRITE_API_KEY ||
  'standard_7a985f3cac7f2b55fc02d15439dbe6f91d04567678748a3f6437491b98dc95a8e52d7224e804ceec3ad14884d841216806170e44e1faeab4a99cfca745f2d951b3bd5eb9e3fef0c1535cf0f3ca7bb0efdadca06ffd3417f8cbf7a2b9071f52de8fb80a91362324ffe5d4ee1cd38883e5e4c190737644e6f40c2293e3308ba702';
const CLOUD_BUCKET_ID = process.env.APPWRITE_BUCKET_ID || 'test-images';

interface CustomerMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  phone?: string;
  subject: string;
  message: string;
  date: string;
  isCloudSaved: boolean;
  fileId?: string;
}

// In-memory cache synced with cloud
let messagesCache: CustomerMessage[] = [
  {
    id: 'welcome_msg_1',
    senderName: 'إدارة متجر فهد (FAHAD)',
    senderEmail: 'support@fahadstore.com',
    phone: '+966500000000',
    subject: 'مرحباً بك في سحابة متجر فهد',
    message: 'تم تفعيل المفتاح السحابي بنجاح لحفظ وتخزين الصور والاحتفاظ بكافة رسائل واستفسارات العملاء.',
    date: new Date().toISOString(),
    isCloudSaved: true,
  },
];

// Helper to headers
function getAppwriteHeaders() {
  return {
    'X-Appwrite-Project': CLOUD_PROJECT_ID,
    'X-Appwrite-Key': CLOUD_API_KEY,
  };
}

// Ensure the bucket exists on startup
async function ensureBucket() {
  try {
    const res = await fetch(`${CLOUD_ENDPOINT}/storage/buckets/${CLOUD_BUCKET_ID}`, {
      headers: getAppwriteHeaders(),
    });
    if (res.status === 404) {
      console.log(`Creating bucket ${CLOUD_BUCKET_ID}...`);
      await fetch(`${CLOUD_ENDPOINT}/storage/buckets`, {
        method: 'POST',
        headers: {
          ...getAppwriteHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucketId: CLOUD_BUCKET_ID,
          name: 'Fahad Store Images & Messages',
          permissions: ['read("any")', 'create("any")', 'update("any")', 'delete("any")'],
          fileSecurity: false,
          enabled: true,
        }),
      });
    }
  } catch (err) {
    console.warn('Bucket verify warning:', err);
  }
}
ensureBucket();

// Load stored messages from Appwrite bucket on boot
async function syncMessagesFromCloud() {
  try {
    const res = await fetch(`${CLOUD_ENDPOINT}/storage/buckets/${CLOUD_BUCKET_ID}/files`, {
      headers: getAppwriteHeaders(),
    });
    if (res.ok) {
      const data: any = await res.json();
      const messageFiles = (data.files || []).filter((f: any) => f.name.startsWith('msg_') && f.name.endsWith('.json'));

      for (const file of messageFiles) {
        try {
          const downloadRes = await fetch(
            `${CLOUD_ENDPOINT}/storage/buckets/${CLOUD_BUCKET_ID}/files/${file.$id}/download`,
            { headers: getAppwriteHeaders() }
          );
          if (downloadRes.ok) {
            const parsed = await downloadRes.json();
            if (parsed && parsed.id && !messagesCache.some((m) => m.id === parsed.id)) {
              messagesCache.unshift({
                ...parsed,
                fileId: file.$id,
                isCloudSaved: true,
              });
            }
          }
        } catch (e) {
          console.warn('Error reading message file:', file.$id, e);
        }
      }
    }
  } catch (err) {
    console.warn('Could not sync messages from cloud:', err);
  }
}
syncMessagesFromCloud();

// --- 1. Cloud Configuration API ---
app.get('/api/cloud/config', (req, res) => {
  res.json({
    status: 'connected',
    endpoint: CLOUD_ENDPOINT,
    projectId: CLOUD_PROJECT_ID,
    bucketId: CLOUD_BUCKET_ID,
    hasApiKey: !!CLOUD_API_KEY,
    keyPrefix: CLOUD_API_KEY.slice(0, 15) + '...',
  });
});

// --- 2. Cloud Image Upload API ---
app.post('/api/cloud/upload-image', async (req, res) => {
  try {
    const { filename, mimeType, base64 } = req.body;
    if (!base64) {
      return res.status(400).json({ error: 'ملف الصورة مطلوب' });
    }

    // Convert base64 data to buffer
    const base64Data = base64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const safeFilename = filename || `image_${Date.now()}.jpg`;
    const safeMime = mimeType || 'image/jpeg';

    const blob = new Blob([buffer], { type: safeMime });
    const formData = new FormData();
    formData.append('fileId', 'unique()');
    formData.append('file', blob, safeFilename);

    const uploadRes = await fetch(`${CLOUD_ENDPOINT}/storage/buckets/${CLOUD_BUCKET_ID}/files`, {
      method: 'POST',
      headers: getAppwriteHeaders(),
      body: formData,
    });

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      console.error('Appwrite upload error:', uploadRes.status, errBody);
      return res.status(uploadRes.status).json({
        error: 'فشل رفع الصورة إلى سحابة Appwrite',
        details: errBody,
      });
    }

    const fileData: any = await uploadRes.json();
    const fileId = fileData.$id;
    const viewUrl = `${CLOUD_ENDPOINT}/storage/buckets/${CLOUD_BUCKET_ID}/files/${fileId}/view?project=${CLOUD_PROJECT_ID}`;
    const previewUrl = `${CLOUD_ENDPOINT}/storage/buckets/${CLOUD_BUCKET_ID}/files/${fileId}/preview?project=${CLOUD_PROJECT_ID}&width=600&height=600`;

    return res.status(201).json({
      success: true,
      $id: fileId,
      name: fileData.name || safeFilename,
      sizeOriginal: fileData.sizeOriginal || buffer.length,
      mimeType: fileData.mimeType || safeMime,
      $createdAt: fileData.$createdAt || new Date().toISOString(),
      bucketId: CLOUD_BUCKET_ID,
      viewUrl,
      previewUrl,
    });
  } catch (error: any) {
    console.error('Server upload image exception:', error);
    return res.status(500).json({ error: error.message || 'خطأ داخلي في الخادم' });
  }
});

// --- 3. Cloud Images List API ---
app.get('/api/cloud/images', async (req, res) => {
  try {
    const listRes = await fetch(`${CLOUD_ENDPOINT}/storage/buckets/${CLOUD_BUCKET_ID}/files`, {
      headers: getAppwriteHeaders(),
    });

    if (!listRes.ok) {
      return res.status(listRes.status).json({ error: 'تعذر جلب ملفات الصور' });
    }

    const data: any = await listRes.json();
    const files = (data.files || [])
      // Exclude internal message JSON files
      .filter((f: any) => !f.name.startsWith('msg_') && !f.name.endsWith('.json'))
      .map((f: any) => ({
        $id: f.$id,
        name: f.name,
        sizeOriginal: f.sizeOriginal,
        mimeType: f.mimeType,
        $createdAt: f.$createdAt,
        bucketId: f.bucketId,
        viewUrl: `${CLOUD_ENDPOINT}/storage/buckets/${CLOUD_BUCKET_ID}/files/${f.$id}/view?project=${CLOUD_PROJECT_ID}`,
        previewUrl: `${CLOUD_ENDPOINT}/storage/buckets/${CLOUD_BUCKET_ID}/files/${f.$id}/preview?project=${CLOUD_PROJECT_ID}&width=600&height=600`,
      }));

    return res.json({ files });
  } catch (error: any) {
    console.error('Server list images exception:', error);
    return res.status(500).json({ error: error.message || 'خطأ داخلي' });
  }
});

// --- 4. Cloud Image Delete API ---
app.delete('/api/cloud/images/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const deleteRes = await fetch(
      `${CLOUD_ENDPOINT}/storage/buckets/${CLOUD_BUCKET_ID}/files/${fileId}`,
      {
        method: 'DELETE',
        headers: getAppwriteHeaders(),
      }
    );

    if (!deleteRes.ok && deleteRes.status !== 404) {
      return res.status(deleteRes.status).json({ error: 'تعذر حذف الصورة من السحابة' });
    }

    return res.json({ success: true, fileId });
  } catch (error: any) {
    console.error('Server delete image exception:', error);
    return res.status(500).json({ error: error.message || 'خطأ داخلي' });
  }
});

// --- 5. Cloud Messages APIs (Retaining Messages) ---
app.get('/api/cloud/messages', (req, res) => {
  res.json({
    total: messagesCache.length,
    messages: messagesCache,
  });
});

app.post('/api/cloud/messages', async (req, res) => {
  try {
    const { senderName, senderEmail, phone, subject, message } = req.body;
    if (!message || !senderName) {
      return res.status(400).json({ error: 'الاسم ونص الرسالة مطلوبان' });
    }

    const newMessage: CustomerMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderName: senderName.trim(),
      senderEmail: (senderEmail || 'customer@fahadstore.com').trim(),
      phone: phone?.trim(),
      subject: (subject || 'استفسار من متجر فهد').trim(),
      message: message.trim(),
      date: new Date().toISOString(),
      isCloudSaved: true,
    };

    // Retain message in Appwrite Cloud Storage permanently
    try {
      const blob = new Blob([JSON.stringify(newMessage)], { type: 'application/json' });
      const formData = new FormData();
      formData.append('fileId', 'unique()');
      formData.append('file', blob, `${newMessage.id}.json`);

      const cloudUpload = await fetch(`${CLOUD_ENDPOINT}/storage/buckets/${CLOUD_BUCKET_ID}/files`, {
        method: 'POST',
        headers: getAppwriteHeaders(),
        body: formData,
      });

      if (cloudUpload.ok) {
        const fileData: any = await cloudUpload.json();
        newMessage.fileId = fileData.$id;
      }
    } catch (uploadErr) {
      console.warn('Failed to upload message file to Appwrite storage, retaining locally:', uploadErr);
    }

    // Prepend to server in-memory list
    messagesCache.unshift(newMessage);

    return res.status(201).json({
      success: true,
      message: newMessage,
    });
  } catch (error: any) {
    console.error('Server save message error:', error);
    return res.status(500).json({ error: error.message || 'خطأ داخلي في حفظ الرسالة' });
  }
});

app.delete('/api/cloud/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const msg = messagesCache.find((m) => m.id === id);

    if (msg && msg.fileId) {
      try {
        await fetch(`${CLOUD_ENDPOINT}/storage/buckets/${CLOUD_BUCKET_ID}/files/${msg.fileId}`, {
          method: 'DELETE',
          headers: getAppwriteHeaders(),
        });
      } catch (e) {
        console.warn('Error deleting cloud message file:', e);
      }
    }

    messagesCache = messagesCache.filter((m) => m.id !== id);
    return res.json({ success: true, id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'خطأ داخلي' });
  }
});

// Vite middleware & Static serving
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fahad Store server running on port ${PORT} with Appwrite Cloud key`);
  });
}

start();
