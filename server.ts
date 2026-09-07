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

// Admin recipient account for routing customer messages & orders inside the site
const ADMIN_EMAIL = 'Alaa.galal.abas1@gmail.com';
const ADMIN_EMAIL_LOWER = ADMIN_EMAIL.toLowerCase();

interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  image?: string;
}

interface CustomerOrder {
  id: string;
  customerName: string;
  customerEmail: string;
  phone?: string;
  city?: string;
  address?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  recipientAdminEmail?: string;
  pointsEarned?: number;
  notes?: string;
  isCloudSaved?: boolean;
  fileId?: string;
}

interface CustomerMessage {
  id: string;
  senderName: string;
  senderEmail: string;
  recipientEmail?: string;
  phone?: string;
  subject: string;
  message: string;
  date: string;
  isCloudSaved: boolean;
  fileId?: string;
  reply?: string;
  replyDate?: string;
  status?: 'unread' | 'read' | 'replied';
}

// In-memory cache synced with cloud
let messagesCache: CustomerMessage[] = [
  {
    id: 'welcome_msg_1',
    senderName: 'إدارة متجر فهد (FAHAD)',
    senderEmail: 'support@fahadstore.com',
    recipientEmail: ADMIN_EMAIL,
    phone: '+966500000000',
    subject: 'مرحباً بك في سحابة متجر فهد',
    message: 'تم تفعيل المفتاح السحابي وربط النظام بحساب الإدارة لاستقبال كافة الطلبات والرسائل وحفظها سحابياً.',
    date: new Date().toISOString(),
    isCloudSaved: true,
    status: 'read',
  },
];

let ordersCache: CustomerOrder[] = [
  {
    id: 'ord_init_9021',
    customerName: 'فهد العتيبي',
    customerEmail: 'customer@fahadstore.com',
    phone: '+966551234567',
    city: 'الرياض',
    address: 'حي النخيل، طريق التخصصي',
    items: [
      {
        productId: 'm1',
        productName: 'بدلة رجالية كلاسيكية إيطالية',
        price: 890,
        quantity: 1,
        size: 'L',
        color: 'كحلي داكن',
      },
    ],
    subtotal: 890,
    shipping: 0,
    total: 890,
    date: new Date(Date.now() - 86400000).toISOString(),
    status: 'processing',
    recipientAdminEmail: ADMIN_EMAIL,
    pointsEarned: 89,
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

// Load stored messages & orders from Appwrite bucket on boot
async function syncFromCloud() {
  try {
    const res = await fetch(`${CLOUD_ENDPOINT}/storage/buckets/${CLOUD_BUCKET_ID}/files`, {
      headers: getAppwriteHeaders(),
    });
    if (res.ok) {
      const data: any = await res.json();
      const files = data.files || [];

      // 1. Sync messages
      const messageFiles = files.filter((f: any) => f.name.startsWith('msg_') && f.name.endsWith('.json'));
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

      // 2. Sync customer orders
      const orderFiles = files.filter((f: any) => f.name.startsWith('ord_') && f.name.endsWith('.json'));
      for (const file of orderFiles) {
        try {
          const downloadRes = await fetch(
            `${CLOUD_ENDPOINT}/storage/buckets/${CLOUD_BUCKET_ID}/files/${file.$id}/download`,
            { headers: getAppwriteHeaders() }
          );
          if (downloadRes.ok) {
            const parsed = await downloadRes.json();
            if (parsed && parsed.id && !ordersCache.some((o) => o.id === parsed.id)) {
              ordersCache.unshift({
                ...parsed,
                fileId: file.$id,
                isCloudSaved: true,
              });
            }
          }
        } catch (e) {
          console.warn('Error reading order file:', file.$id, e);
        }
      }
    }
  } catch (err) {
    console.warn('Could not sync data from cloud:', err);
  }
}
syncFromCloud();

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

// --- 5. Cloud Messages APIs (Retaining Messages & Routing to Admin) ---
app.get('/api/cloud/messages', (req, res) => {
  const email = ((req.query.email as string) || '').toLowerCase().trim();
  // If no email or user is admin, return all messages
  if (!email || email === ADMIN_EMAIL_LOWER) {
    return res.json({
      total: messagesCache.length,
      messages: messagesCache,
    });
  }
  // Filter for specific customer
  const userMessages = messagesCache.filter(
    (m) =>
      (m.senderEmail || '').toLowerCase().trim() === email ||
      (m.recipientEmail || '').toLowerCase().trim() === email
  );
  return res.json({
    total: userMessages.length,
    messages: userMessages,
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
      recipientEmail: ADMIN_EMAIL,
      phone: phone?.trim(),
      subject: (subject || 'استفسار من متجر فهد').trim(),
      message: message.trim(),
      date: new Date().toISOString(),
      isCloudSaved: true,
      status: 'unread',
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

// Admin reply to customer message
app.post('/api/cloud/messages/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { replyText } = req.body;
    if (!replyText) {
      return res.status(400).json({ error: 'نص الرد مطلوب' });
    }

    const msgIndex = messagesCache.findIndex((m) => m.id === id);
    if (msgIndex === -1) {
      return res.status(404).json({ error: 'الرسالة غير موجودة' });
    }

    messagesCache[msgIndex].reply = replyText.trim();
    messagesCache[msgIndex].replyDate = new Date().toISOString();
    messagesCache[msgIndex].status = 'replied';

    // Update in Appwrite Cloud Storage if possible
    const updated = messagesCache[msgIndex];
    if (updated.fileId) {
      try {
        const blob = new Blob([JSON.stringify(updated)], { type: 'application/json' });
        const formData = new FormData();
        formData.append('fileId', 'unique()');
        formData.append('file', blob, `${updated.id}.json`);
        await fetch(`${CLOUD_ENDPOINT}/storage/buckets/${CLOUD_BUCKET_ID}/files`, {
          method: 'POST',
          headers: getAppwriteHeaders(),
          body: formData,
        });
      } catch (err) {
        console.warn('Could not update cloud file with reply:', err);
      }
    }

    return res.json({ success: true, message: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'خطأ في إرسال الرد' });
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

// --- 6. Cloud Orders APIs (Retaining Customer Orders & Routing to Admin) ---
app.get('/api/cloud/orders', (req, res) => {
  const email = ((req.query.email as string) || '').toLowerCase().trim();
  // If requesting user is admin or no email provided, return ALL orders
  if (!email || email === ADMIN_EMAIL_LOWER) {
    return res.json({
      total: ordersCache.length,
      orders: ordersCache,
    });
  }
  // Otherwise filter for this specific customer
  const customerOrders = ordersCache.filter(
    (o) => (o.customerEmail || '').toLowerCase().trim() === email
  );
  return res.json({
    total: customerOrders.length,
    orders: customerOrders,
  });
});

app.post('/api/cloud/orders', async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      phone,
      city,
      address,
      items,
      subtotal,
      shipping,
      total,
      notes,
      pointsEarned,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'عناصر السلة مطلوبة لإتمام الطلب' });
    }

    const newOrder: CustomerOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      customerName: (customerName || 'عميل متجر فهد').trim(),
      customerEmail: (customerEmail || 'customer@fahadstore.com').toLowerCase().trim(),
      phone: phone?.trim() || '',
      city: city?.trim() || 'الرياض',
      address: address?.trim() || '',
      items: items.map((i: any) => ({
        productId: i.productId || i.id,
        productName: i.productName || i.name,
        price: Number(i.price) || 0,
        quantity: Number(i.quantity) || 1,
        size: i.size || i.selectedSize,
        color: i.color || i.selectedColor,
        image: i.image,
      })),
      subtotal: Number(subtotal) || 0,
      shipping: Number(shipping) || 0,
      total: Number(total) || 0,
      date: new Date().toISOString(),
      status: 'processing',
      recipientAdminEmail: ADMIN_EMAIL,
      pointsEarned: Number(pointsEarned) || 0,
      notes: notes?.trim() || '',
      isCloudSaved: true,
    };

    // Retain order in Appwrite Cloud Storage permanently
    try {
      const blob = new Blob([JSON.stringify(newOrder)], { type: 'application/json' });
      const formData = new FormData();
      formData.append('fileId', 'unique()');
      formData.append('file', blob, `${newOrder.id}.json`);

      const cloudUpload = await fetch(`${CLOUD_ENDPOINT}/storage/buckets/${CLOUD_BUCKET_ID}/files`, {
        method: 'POST',
        headers: getAppwriteHeaders(),
        body: formData,
      });

      if (cloudUpload.ok) {
        const fileData: any = await cloudUpload.json();
        newOrder.fileId = fileData.$id;
      }
    } catch (uploadErr) {
      console.warn('Failed to upload order file to Appwrite storage, retaining locally:', uploadErr);
    }

    ordersCache.unshift(newOrder);

    return res.status(201).json({
      success: true,
      order: newOrder,
    });
  } catch (error: any) {
    console.error('Server save order error:', error);
    return res.status(500).json({ error: error.message || 'خطأ داخلي في حفظ الطلب' });
  }
});

// Update order status (Admin operation)
app.patch('/api/cloud/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const orderIndex = ordersCache.findIndex((o) => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'الطلب غير موجود' });
    }

    ordersCache[orderIndex].status = status;
    return res.json({ success: true, order: ordersCache[orderIndex] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'خطأ في تحديث حالة الطلب' });
  }
});

app.delete('/api/cloud/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = ordersCache.find((o) => o.id === id);

    if (order && order.fileId) {
      try {
        await fetch(`${CLOUD_ENDPOINT}/storage/buckets/${CLOUD_BUCKET_ID}/files/${order.fileId}`, {
          method: 'DELETE',
          headers: getAppwriteHeaders(),
        });
      } catch (e) {
        console.warn('Error deleting cloud order file:', e);
      }
    }

    ordersCache = ordersCache.filter((o) => o.id !== id);
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
