export enum NotificationType {
  // Сообщения
  MESSAGE_NEW = 'MESSAGE_NEW', // Новое сообщение в чате

  // Бронирования
  BOOKING_NEW = 'BOOKING_NEW', // Новая бронь (для админа/исполнителя)
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED', // Бронь подтверждена (для клиента)
  BOOKING_CANCELLED = 'BOOKING_CANCELLED', // Бронь отменена
  BOOKING_REJECTED = 'BOOKING_REJECTED',   // Бронь отклонена
  BOOKING_REMINDER = 'BOOKING_REMINDER',   // Напоминание о предстоящей брони
  BOOKING_EXPIRING = 'BOOKING_EXPIRING',   // Бронь скоро истечет
  BOOKING_COMPLETED = 'BOOKING_COMPLETED', // Бронь завершена

  // Объявления
  LISTING_APPROVED = 'LISTING_APPROVED', // Объявление прошло модерацию
  LISTING_REJECTED = 'LISTING_REJECTED', // Объявление отклонено модерацией
  LISTING_EXPIRING = 'LISTING_EXPIRING', // Срок размещения скоро истечет
  LISTING_EXPIRED = 'LISTING_EXPIRED',   // Срок размещения истек

  // Отзывы
  REVIEW_NEW = 'REVIEW_NEW', // Получен новый отзыв

  // Подписки
  SUBSCRIPTION_STARTED = 'SUBSCRIPTION_STARTED',     // Подписка оформлена
  SUBSCRIPTION_RENEWED = 'SUBSCRIPTION_RENEWED',     // Подписка продлена
  SUBSCRIPTION_EXPIRING = 'SUBSCRIPTION_EXPIRING',   // Подписка скоро истечет
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',     // Подписка истекла
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED', // Подписка отменена
  SUBSCRIPTION_PAYMENT_FAILED = 'SUBSCRIPTION_PAYMENT_FAILED', // Не удалось списать оплату за подписку

  // Безопасность
  LOGIN_NEW = 'LOGIN_NEW', // Вход с нового устройства
}
