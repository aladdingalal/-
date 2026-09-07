// Store WhatsApp Configuration
// WhatsApp number for receiving customer orders in international format (e.g. 201012345678)
export const DEFAULT_WHATSAPP_NUMBER = '201000000000'; // سيتم تحديثه برقم الواتساب الخاص بك

export function getStoreWhatsAppNumber(): string {
  try {
    const saved = localStorage.getItem('STORE_WHATSAPP_NUMBER');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\+/g, '').replace(/\s+/g, '');
    }
  } catch (e) {
    console.warn(e);
  }
  return DEFAULT_WHATSAPP_NUMBER;
}

export function setStoreWhatsAppNumber(num: string): void {
  try {
    const clean = num.trim().replace(/\+/g, '').replace(/\s+/g, '');
    localStorage.setItem('STORE_WHATSAPP_NUMBER', clean);
  } catch (e) {
    console.warn(e);
  }
}

export interface WhatsAppOrderDetails {
  customerName: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
}

export function formatWhatsAppOrderMessage(order: WhatsAppOrderDetails): string {
  const itemsText = order.items
    .map((item, idx) => {
      const details: string[] = [];
      if (item.size) details.push(`مقاس: ${item.size}`);
      if (item.color) details.push(`لون: ${item.color}`);
      const detailsStr = details.length > 0 ? ` (${details.join(' - ')})` : '';
      return `${idx + 1}. *${item.name}*${detailsStr}\n   - الكمية: ${item.quantity} × ${item.price} ج.م = *${item.quantity * item.price} ج.م*`;
    })
    .join('\n');

  const shippingText = order.shipping === 0 ? 'مجاني (عرض ترويجي)' : `${order.shipping} ج.م`;

  return (
    `🛍️ *طلب شراء جديد من متجر فهد (FAHAD Store)*\n` +
    `------------------------------------\n` +
    `👤 *بيانات العميل والتوصيل:*\n` +
    `• *الاسم:* ${order.customerName}\n` +
    `• *رقم الهاتف:* ${order.phone}\n` +
    `• *المحافظة:* ${order.city}\n` +
    `• *العنوان بالتفصيل:* ${order.address}\n` +
    (order.notes ? `• *ملاحظات:* ${order.notes}\n` : '') +
    `------------------------------------\n` +
    `📦 *المنتجات المطلوبة:*\n` +
    `${itemsText}\n` +
    `------------------------------------\n` +
    `💰 *الحساب الإجمالي:*\n` +
    `• المجموع الفرعي: ${order.subtotal} ج.م\n` +
    `• مصاريف الشحن: ${shippingText}\n` +
    `• *الإجمالي المطلوب:* *${order.total} ج.م*\n` +
    `------------------------------------\n` +
    `يرجى تأكيد استلام الطلب وتحديد موعد الشحن والتسليم. شكراً لكم 🙏`
  );
}

export function getWhatsAppOrderUrl(order: WhatsAppOrderDetails): string {
  const number = getStoreWhatsAppNumber();
  const message = formatWhatsAppOrderMessage(order);
  const encoded = encodeURIComponent(message);

  // If number is still the default placeholder, open WhatsApp send dialog directly so user can choose or send
  if (!number || number === '201000000000') {
    return `https://api.whatsapp.com/send?text=${encoded}`;
  }
  return `https://wa.me/${number}?text=${encoded}`;
}
