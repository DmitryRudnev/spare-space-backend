// src/notifications/services/notification-message-builder.service.ts
import { Injectable } from '@nestjs/common';
import { NotificationType } from '../../common/enums/notification-type.enum';
import {
  AnyNotificationPayload,
  MessagePayload,
  BookingPayload,
  ListingPayload,
  ReviewPayload,
  PaymentPayload,
  SubscriptionPayload,
  LoginPayload,
} from '../../common/interfaces/notification-payloads.interface';

@Injectable()
export class NotificationMessageBuilder {
  /**
   * Основной метод формирования заголовка и тела уведомления.
   * @param type - тип уведомления
   * @param payload - данные уведомления
   * @returns объект с полями title и body
   */
  build(type: NotificationType, payload?: AnyNotificationPayload): { title: string; body: string } {
    switch (type) {
      // Сообщения
      case NotificationType.MESSAGE_NEW:
        return this.buildMessageNew(payload as MessagePayload | undefined);

      // Бронирования
      case NotificationType.BOOKING_NEW:
        return this.buildBookingNew(payload as BookingPayload | undefined);
      case NotificationType.BOOKING_CONFIRMED:
        return this.buildBookingConfirmed(payload as BookingPayload | undefined);
      case NotificationType.BOOKING_CANCELLED:
        return this.buildBookingCancelled(payload as BookingPayload | undefined);
      case NotificationType.BOOKING_REMINDER:
        return this.buildBookingReminder(payload as BookingPayload | undefined);
      case NotificationType.BOOKING_EXPIRING:
        return this.buildBookingExpiring(payload as BookingPayload | undefined);
      case NotificationType.BOOKING_COMPLETED:
        return this.buildBookingCompleted(payload as BookingPayload | undefined);

      // Объявления
      case NotificationType.LISTING_APPROVED:
        return this.buildListingApproved(payload as ListingPayload | undefined);
      case NotificationType.LISTING_REJECTED:
        return this.buildListingRejected(payload as ListingPayload | undefined);
      case NotificationType.LISTING_EXPIRING:
        return this.buildListingExpiring(payload as ListingPayload | undefined);
      case NotificationType.LISTING_EXPIRED:
        return this.buildListingExpired(payload as ListingPayload | undefined);

      // Отзывы
      case NotificationType.REVIEW_NEW:
        return this.buildReviewNew(payload as ReviewPayload | undefined);

      // Платежи
      case NotificationType.PAYMENT_SUCCESS:
        return this.buildPaymentSuccess(payload as PaymentPayload | undefined);
      case NotificationType.PAYMENT_FAILED:
        return this.buildPaymentFailed(payload as PaymentPayload | undefined);

      // Подписки
      case NotificationType.SUBSCRIPTION_STARTED:
        return this.buildSubscriptionStarted(payload as SubscriptionPayload | undefined);
      case NotificationType.SUBSCRIPTION_RENEWED:
        return this.buildSubscriptionRenewed(payload as SubscriptionPayload | undefined);
      case NotificationType.SUBSCRIPTION_EXPIRING:
        return this.buildSubscriptionExpiring(payload as SubscriptionPayload | undefined);
      case NotificationType.SUBSCRIPTION_EXPIRED:
        return this.buildSubscriptionExpired(payload as SubscriptionPayload | undefined);
      case NotificationType.SUBSCRIPTION_CANCELLED:
        return this.buildSubscriptionCancelled(payload as SubscriptionPayload | undefined);
      case NotificationType.SUBSCRIPTION_PAYMENT_FAILED:
        return this.buildSubscriptionPaymentFailed(payload as SubscriptionPayload | undefined);

      // Безопасность
      case NotificationType.LOGIN_NEW:
        return this.buildLoginNew(payload as LoginPayload | undefined);

      default:
        // На случай неизвестного типа – возвращаем заглушку
        return {
          title: 'Новое уведомление',
          body: type,
        };
    }
  }

  // ---------- Приватные методы для каждого типа ----------

  // ---------- Сообщения ----------
  private buildMessageNew(payload?: MessagePayload): { title: string; body: string } {
    const title = '📩 Новое сообщение';
    if (!payload) {
      return {
        title,
        body: 'Вам прислали сообщение',
      };
    }
    let body = payload.listingTitle ? `📍 Объявление: ${payload.listingTitle}\n` : '';
    body += `👤 ${payload.senderName}: ${this.truncate(payload.text || '', 100)}`;
    return { title, body };
  }

  // ---------- Бронирования ----------
  private buildBookingNew(payload?: BookingPayload): { title: string; body: string } {
    const title = '📅 Новое бронирование';
    if (!payload) {
      return { title, body: 'Вам пришла новая заявка на бронирование' };
    }
    let body = `Вам пришла новая заявка на бронирование «${payload.listingTitle}»`;
    if (payload.price && payload.currency) {
      body += ` на сумму ${payload.price} ${payload.currency}`;
    }
    if (payload.startDate) {
      body += ` с ${this.formatDate(payload.startDate)}`;
    }
    if (payload.endDate) {
      body += ` по ${this.formatDate(payload.endDate)}`;
    }
    if (payload.renterName && payload.renterRating && payload.renterVerified) {
      body += `\nАрендатор: ${payload.renterName}, 
      рейтинг ${payload.renterRating}, 
      пользователь ${payload.renterVerified ? '' : 'не '}верифицирован`;
    }
    return { title, body };
  }

  private buildBookingConfirmed(payload?: BookingPayload): { title: string; body: string } {
    const title = '✅ Бронирование подтверждено';
    if (!payload) {
      return { title, body: 'Ваше бронирование подтверждено' };
    }
    let body = `Ваше бронирование объекта «${payload.listingTitle}» подтверждено`;
    if (payload.startDate) {
      body += ` на ${this.formatDate(payload.startDate)}`;
    }
    if (payload.price && payload.currency) {
      body += `. Сумма: ${payload.price} ${payload.currency}`;
    }
    return { title, body };
  }

  private buildBookingCancelled(payload?: BookingPayload): { title: string; body: string } {
    const title = '❌ Бронирование отменено';
    if (!payload) {
      return { title, body: 'Ваше бронирование отменено' };
    }
    let body = `Бронирование для «${payload.listingTitle}» отменено`;
    if (payload.startDate) {
      body += ` (планировалось на ${this.formatDate(payload.startDate)})`;
    }
    return { title, body };
  }

  private buildBookingReminder(payload?: BookingPayload): { title: string; body: string } {
    const title = '⏰ Напоминание о бронировании';
    if (!payload) {
      return { title, body: 'У вас скоро бронирование' };
    }
    const start = payload.startDate ? this.formatDate(payload.startDate) : 'скоро';
    const end = payload.endDate ? this.formatDate(payload.endDate) : '';
    let body = `Напоминаем: бронирование «${payload.listingTitle}» начнётся ${start}`;
    if (end) body += `, закончится ${end}`;
    return { title, body };
  }

  private buildBookingExpiring(payload?: BookingPayload): { title: string; body: string } {
    const title = '⚠️ Бронирование скоро истекает';
    if (!payload) {
      return { title, body: 'Срок бронирования подходит к концу' };
    }
    let body = `Бронирование «${payload.listingTitle}» заканчивается`;
    if (payload.endDate) {
      body += ` ${this.formatDate(payload.endDate)}`;
    }
    body += '. Не забудьте продлить или завершить.';
    return { title, body };
  }

  private buildBookingCompleted(payload?: BookingPayload): { title: string; body: string } {
    const title = '🎉 Бронирование завершено';
    if (!payload) {
      return { title, body: 'Бронирование завершено' };
    }
    let body = `Бронирование «${payload.listingTitle}» завершено`;
    if (payload.endDate) {
      body += ` ${this.formatDate(payload.endDate)}`;
    }
    body += '. Оставьте отзыв!';
    return { title, body };
  }

  // ---------- Объявления ----------
  private buildListingApproved(payload?: ListingPayload): { title: string; body: string } {
    const title = '✅ Объявление одобрено';
    if (!payload) {
      return { title, body: 'Ваше объявление прошло модерацию' };
    }
    return {
      title,
      body: `Ваше объявление «${payload.listingTitle}» прошло модерацию и опубликовано.`,
    };
  }

  private buildListingRejected(payload?: ListingPayload): { title: string; body: string } {
    const title = '❌ Объявление отклонено';
    if (!payload) {
      return { title, body: 'Ваше объявление отклонено' };
    }
    const reason = payload.reason ? ` Причина: ${payload.reason}` : '';
    return {
      title,
      body: `Объявление «${payload.listingTitle}» отклонено модерацией.${reason}`,
    };
  }

  private buildListingExpiring(payload?: ListingPayload): { title: string; body: string } {
    const title = '⚠️ Скоро истекает срок размещения';
    if (!payload) {
      return { title, body: 'Срок размещения объявления скоро истекает' };
    }
    return {
      title,
      body: `Срок размещения объявления «${payload.listingTitle}» истекает. Продлите, чтобы не потерять просмотры.`,
    };
  }

  private buildListingExpired(payload?: ListingPayload): { title: string; body: string } {
    const title = '⌛ Срок размещения истек';
    if (!payload) {
      return { title, body: 'Срок размещения объявления истек' };
    }
    return {
      title,
      body: `Объявление «${payload.listingTitle}» снято с публикации.`,
    };
  }

  // ---------- Отзывы ----------
  private buildReviewNew(payload?: ReviewPayload): { title: string; body: string } {
    const title = '⭐ Новый отзыв';
    if (!payload) {
      return { title, body: 'Вам оставили новый отзыв' };
    }
    return {
      title,
      body: `${payload.fromUserName} оставил отзыв на «${payload.listingTitle}». Оценка: ${payload.rating}/5.`,
    };
  }

  // ---------- Платежи ----------
  private buildPaymentSuccess(payload?: PaymentPayload): { title: string; body: string } {
    const title = '💰 Платёж успешен';
    if (!payload) {
      return { title, body: 'Платёж прошёл успешно' };
    }
    return {
      title,
      body: `Платёж на сумму ${payload.amount} ${payload.currency} прошёл успешно.`,
    };
  }

  private buildPaymentFailed(payload?: PaymentPayload): { title: string; body: string } {
    const title = '❌ Ошибка платежа';
    if (!payload) {
      return { title, body: 'Не удалось провести платёж' };
    }
    const desc = payload.description ? ` Причина: ${payload.description}` : '';
    return {
      title,
      body: `Не удалось провести платёж на сумму ${payload.amount} ${payload.currency}.${desc}`,
    };
  }

  // ---------- Подписки ----------
  private buildSubscriptionStarted(payload?: SubscriptionPayload): { title: string; body: string } {
    const title = '🎉 Подписка оформлена';
    if (!payload) {
      return { title, body: 'Подписка успешно оформлена' };
    }
    return {
      title,
      body: `Подписка «${payload.planName}» активирована.`,
    };
  }

  private buildSubscriptionRenewed(payload?: SubscriptionPayload): { title: string; body: string } {
    const title = '🔄 Подписка продлена';
    if (!payload) {
      return { title, body: 'Подписка успешно продлена' };
    }
    const end = payload.endDate ? this.formatDate(payload.endDate) : 'неизвестно';
    return {
      title,
      body: `Подписка «${payload.planName}» продлена до ${end}.`,
    };
  }

  private buildSubscriptionExpiring(payload?: SubscriptionPayload): { title: string; body: string } {
    const title = '⚠️ Подписка скоро истечёт';
    if (!payload) {
      return { title, body: 'Срок подписки подходит к концу' };
    }
    const end = payload.endDate ? this.formatDate(payload.endDate) : 'скоро';
    return {
      title,
      body: `Подписка «${payload.planName}» истекает ${end}. Продлите сейчас.`,
    };
  }

  private buildSubscriptionExpired(payload?: SubscriptionPayload): { title: string; body: string } {
    const title = '⌛ Подписка истекла';
    if (!payload) {
      return { title, body: 'Срок подписки истёк' };
    }
    return {
      title,
      body: `Срок действия подписки «${payload.planName}» истёк.`,
    };
  }

  private buildSubscriptionCancelled(payload?: SubscriptionPayload): { title: string; body: string } {
    const title = '❌ Подписка отменена';
    if (!payload) {
      return { title, body: 'Подписка отменена' };
    }
    return {
      title,
      body: `Подписка «${payload.planName}» отменена.`,
    };
  }

  private buildSubscriptionPaymentFailed(payload?: SubscriptionPayload): { title: string; body: string } {
    const title = '💳❌ Ошибка оплаты подписки';
    if (!payload) {
      return { title, body: 'Не удалось списать оплату за подписку' };
    }
    return {
      title,
      body: `Не удалось списать оплату за подписку «${payload.planName}». Проверьте способ оплаты.`,
    };
  }

  // ---------- Безопасность ----------
  private buildLoginNew(payload?: LoginPayload): { title: string; body: string } {
    const title = '🔐 Новый вход в аккаунт';
    if (!payload) {
      return { title, body: 'Выполнен вход с нового устройства' };
    }
    const time = payload.time ? ` в ${this.formatDateTime(payload.time)}` : '';
    return {
      title,
      body: `Выполнен вход с нового устройства: ${payload.deviceInfo}${time}. Если это были не вы, смените пароль.`,
    };
  }

  private formatDate(date?: Date, locale: string = 'ru-RU'): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString(locale);
  }

  private formatDateTime(date?: Date, locale: string = 'ru-RU'): string {
    if (!date) return '';
    return new Date(date).toLocaleString(locale);
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
}
