CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TYPE user_role_type AS ENUM ('RENTER', 'LANDLORD', 'ADMIN');
CREATE TYPE listing_type AS ENUM ('GARAGE', 'STORAGE', 'PARKING');
CREATE TYPE listing_period_type AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH');
CREATE TYPE listing_status AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'INACTIVE');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE payment_method AS ENUM ('CARD', 'SBP', 'USDT', 'ETH', 'TRX');
CREATE TYPE payment_status AS ENUM ('PENDING', 'BLOCKED', 'COMPLETED', 'REFUNDED');
CREATE TYPE transaction_type AS ENUM ('TOPUP', 'CHARGE', 'PAYOUT', 'COMMISSION');
CREATE TYPE notification_channel AS ENUM ('WEBSOCKET', 'FCM', 'EMAIL', 'SMS', 'TG_BOT');
CREATE TYPE notification_delivery_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
CREATE TYPE notification_type AS ENUM (
    -- Сообщения
    'MESSAGE_NEW',      -- Новое сообщение в чате
    
    -- Бронирования
    'BOOKING_NEW',       -- Новая бронь (для админа/исполнителя)
    'BOOKING_CONFIRMED', -- Бронь подтверждена (для клиента)
    'BOOKING_CANCELLED', -- Бронь отменена
    'BOOKING_REMINDER',  -- Напоминание о предстоящей брони
    'BOOKING_EXPIRING',  -- Бронь скоро истечет (неоплачена/неподтверждена)
    'BOOKING_COMPLETED', -- Бронь завершена
    
    -- Объявления
    'LISTING_APPROVED',  -- Объявление прошло модерацию
    'LISTING_REJECTED',  -- Объявление отклонено модерацией
    'LISTING_EXPIRING',  -- Срок размещения скоро истечет
    'LISTING_EXPIRED',   -- Срок размещения истек
    
    -- Отзывы
    'REVIEW_NEW',        -- Получен новый отзыв
    
    -- Платежи
    'PAYMENT_SUCCESS',   -- Платеж прошел успешно
    'PAYMENT_FAILED',    -- Ошибка платежа
    
    -- Подписки
    'SUBSCRIPTION_STARTED',      -- Подписка оформлена
    'SUBSCRIPTION_RENEWED',      -- Подписка продлена
    'SUBSCRIPTION_EXPIRING',     -- Подписка скоро истечет
    'SUBSCRIPTION_EXPIRED',      -- Подписка истекла
    'SUBSCRIPTION_CANCELLED',    -- Подписка отменена
    'SUBSCRIPTION_PAYMENT_FAILED', -- Не удалось списать оплату за подписку
    
    -- Безопасность
    'LOGIN_NEW'         -- Вход с нового устройства
);
CREATE TYPE subscription_plan_status AS ENUM('ACTIVE', 'INACTIVE');
CREATE TYPE subscription_status AS ENUM('ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE moderation_entity_type AS ENUM ('LISTING', 'REVIEW', 'USER');
CREATE TYPE moderation_action AS ENUM ('APPROVE', 'REJECT', 'EDIT', 'BAN');



CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL, 
    patronymic VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    rating DECIMAL(3,2),
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    telegram_id BIGINT,
    telegram_chat_id BIGINT,
    telegram_username VARCHAR(64),
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    two_fa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_fa_secret TEXT,
    two_fa_recovery_codes_hashes JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);



CREATE TABLE user_devices (
    -- id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL, -- Уникальный ID самого устройства (UUID с фронта)
    fcm_token TEXT NOT NULL,
    platform VARCHAR(20), -- 'ios', 'android', 'web'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);



CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role_type NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);



CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_user_tokens_refresh_token ON refresh_tokens(token_hash);



CREATE TABLE listings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type listing_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(26,16) NOT NULL,  -- цена за единицу времени(за день/неделю/месяц)
    price_period listing_period_type NOT NULL DEFAULT 'DAY',  -- период времени, за который указывается цена
    location GEOMETRY(POINT, 4326),
    address VARCHAR(500) NOT NULL,
    size DECIMAL(10,2),
    photo_urls JSONB,  -- массив URL в S3
    amenities JSONB,  -- например, { "security": true, "electricity": true }
    availability TSTZRANGE[] NOT NULL,  -- массив периодов доступности
    status listing_status NOT NULL DEFAULT 'DRAFT',
    rating DECIMAL(3,2),
    views_count INTEGER NOT NULL DEFAULT 0,
    reposts_count INTEGER NOT NULL DEFAULT 0,
    favorites_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_type ON listings(type);
CREATE INDEX idx_listings_location ON listings USING GIST(location);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_availability ON listings USING GIN(availability);
CREATE INDEX idx_listings_title_trgm ON listings USING gin (title gin_trgm_ops);



CREATE TABLE bookings (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    renter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period TSTZRANGE NOT NULL,  -- период брони (start_date, end_date)
    total_price DECIMAL(26,16) NOT NULL,  -- [цена за единицу времени] * [кол-во дней/недель/месяцев]
    status booking_status NOT NULL DEFAULT 'PENDING',
    completion_job_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX idx_bookings_renter_id ON bookings(renter_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_period ON bookings USING GIST(period);



CREATE TABLE wallets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(26,16) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);



CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(26,16) NOT NULL,
    method payment_method NOT NULL,
    status payment_status NOT NULL DEFAULT 'PENDING',
    gateway_transaction_id VARCHAR(255),  -- для РФ-шлюзов/крипты
    refund_reason TEXT,  -- при возврате
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);



CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    amount DECIMAL(26,16) NOT NULL,
    status payment_status NOT NULL DEFAULT 'COMPLETED',
    booking_id BIGINT REFERENCES bookings(id) ON DELETE SET NULL,
    commission DECIMAL(26,16) NOT NULL DEFAULT 0,
    description TEXT,
    gateway_transaction_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);



CREATE TABLE subscription_plans (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,  -- Название тарифа, например, "Basic", "Pro"
    status subscription_plan_status NOT NULL DEFAULT 'ACTIVE',
    price DECIMAL(26,16) NOT NULL,
    max_listings INTEGER NOT NULL,
    priority_search BOOLEAN NOT NULL,
    boosts_per_month INTEGER NOT NULL,  -- Количество доступных поднятий в месяц
    description TEXT,
    extra_features JSONB,  -- Для редко используемых или будущих фич
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_name ON subscription_plans(name);



CREATE TABLE user_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id BIGINT NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,  -- NULL для бессрочных подписок
    status subscription_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);



-- чат между двумя пользователями по конкретному объявлению
CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,
    participant1_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant2_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id BIGINT REFERENCES listings(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_conversations_participant1_id ON conversations(participant1_id);
CREATE INDEX idx_conversations_participant2_id ON conversations(participant2_id);
CREATE INDEX idx_conversations_listing_id ON conversations(listing_id);



-- сообщения в чате
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);



CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    reference_id BIGINT,  -- ID связанной сущности (например, booking_id для уведомлений о бронировании)
    payload JSONB,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);



CREATE TABLE notification_deliveries (
    id BIGSERIAL PRIMARY KEY,
    notification_id BIGINT NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    channel notification_channel NOT NULL,
    status notification_delivery_status NOT NULL DEFAULT 'SUCCESS',
    error_message TEXT,  -- в случае неудачи
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_deliveries_notification_id ON notification_deliveries(notification_id);
CREATE INDEX idx_notification_deliveries_channel ON notification_deliveries(channel);
CREATE INDEX idx_notification_deliveries_status ON notification_deliveries(status);



CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    reviewer_id BIGINT NOT NULL REFERENCES users(id),
    rating INTEGER NOT NULL,
    text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_listing_id ON reviews(booking_id);
CREATE INDEX idx_reviews_to_user_id ON reviews(reviewer_id);



-- хранит публичные вопросы и ответы по объявлениям
CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    from_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    answer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    answered_at TIMESTAMPTZ
);

CREATE INDEX idx_questions_listing_id ON questions(listing_id);
CREATE INDEX idx_questions_from_user_id ON questions(from_user_id);
CREATE INDEX idx_questions_to_user_id ON questions(to_user_id);



CREATE TABLE view_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_view_history_user_id ON view_history(user_id);
CREATE INDEX idx_view_history_listing_id ON view_history(listing_id);



CREATE TABLE reposts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, listing_id)
);

CREATE INDEX idx_reposts_user_id ON reposts(user_id);
CREATE INDEX idx_reposts_listing_id ON reposts(listing_id);



CREATE TABLE favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id BIGINT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, listing_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_listing_id ON favorites(listing_id);



CREATE TABLE telegram_auth_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(64) UNIQUE NOT NULL,
    telegram_id BIGINT,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_telegram_auth_tokens_token ON telegram_auth_tokens(token);
CREATE INDEX idx_telegram_auth_tokens_user_id ON telegram_auth_tokens(user_id);
CREATE INDEX idx_telegram_auth_tokens_expires ON telegram_auth_tokens(expires_at);
CREATE INDEX idx_telegram_auth_tokens_used ON telegram_auth_tokens(used);



CREATE TABLE moderation_logs (
    id BIGSERIAL PRIMARY KEY,
    entity_type moderation_entity_type NOT NULL,
    entity_id BIGINT NOT NULL,
    admin_id BIGINT REFERENCES users(id) ON DELETE SET NULL,  -- администратор, выполнивший действие
    action moderation_action NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moderation_logs_entity_type ON moderation_logs(entity_type);
CREATE INDEX idx_moderation_logs_admin_id ON moderation_logs(admin_id);



CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,  -- Пользователь, совершивший действие
    action VARCHAR(100) NOT NULL,  -- Тип действия, например, 'CREATE_LISTING', 'UPDATE_PROFILE'
    entity_id BIGINT,  -- ID сущности, если применимо
    details JSONB,  -- Дополнительные данные (например, старые/новые значения)
    ip_address INET,  -- Опционально
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
