export interface MessagePayload {
  messageId: number;       // Для идентификации конкретного сообщения
  conversationId: number;  // Чтобы фронтенд знал, какой чат открыть
  senderId: number;        // ID отправителя
  senderName: string;      // Имя для отображения в пуше (например, "Иван:")
  text: string;            // Текст сообщения (или превью)
  listingId?: number;      // Необязательно, но полезно для контекста
  listingTitle?: string;   // Заголовок чата (название объявления)
}

export interface BookingPayload {
  bookingId: number;       // ID для перехода в детали бронирования
  listingId: number;       // ID объявления
  listingTitle: string;    // Название объекта (чтобы не путать брони)
  renterName?: string;     // Имя арендатора (для BOOKING_NEW)
  renterRating?: number;   // Рейтинг арендатора (для BOOKING_NEW)
  renterVerified?: number; // Верифицирован ли арендатор (для BOOKING_NEW)
  startDate?: Date;        // Для BOOKING_REMINDER
  endDate?: Date;          // Для BOOKING_EXPIRING
  price?: number;          // Сумма сделки
}

export interface ListingPayload {
  listingId: number;
  listingTitle: string;
  reason?: string;         // Для LISTING_REJECTED
}

export interface ReviewPayload {
  reviewId: number;
  bookingId: number;
  listingId: number;
  listingTitle: string;    // "Новый отзыв о вашем объявлении 'Гараж'"
  fromUserName: string;    // Кто оставил отзыв
  rating: number;          // Оценка
}

export interface SubscriptionPayload {
  subscriptionId: number;
  planName: string;            // Название тарифа
  endDate?: Date;              // Для SUBSCRIPTION_EXPIRING
}

export interface LoginPayload {
  deviceInfo: string;  // "iPhone 15, Chrome" или "IP: 192.168..."
  time: Date;          // Время входа
}

export type AnyNotificationPayload = 
  | MessagePayload 
  | BookingPayload
  | ListingPayload
  | ReviewPayload
  | SubscriptionPayload
  | LoginPayload;
