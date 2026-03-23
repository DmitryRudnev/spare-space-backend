-- USERS
INSERT INTO users (email, phone, first_name, last_name, patronymic, password_hash, rating, two_fa_enabled, verified, created_at) VALUES
('user1@example.com', '+79000000001', 'Данил', 'Колбасенко', 'Бенедиктович', '$2b$12$0INxsLXfDmt0tkr9u4H28e8pWS.EtA.D7D6Ao.ZH4rUDYzuienbXG', 4.5, false, true, NOW() - INTERVAL '30 days'),
('user2@example.com', '+79000000002', 'Пепе', 'Шнейне', 'Ватафакович', '$2b$12$0INxsLXfDmt0tkr9u4H28e8pWS.EtA.D7D6Ao.ZH4rUDYzuienbXG', 4.2, false, false, NOW() - INTERVAL '25 days'),
('user3@example.com', '+79000000003', 'Лариса', 'Долина', 'Александровна', '$2b$12$0INxsLXfDmt0tkr9u4H28e8pWS.EtA.D7D6Ao.ZH4rUDYzuienbXG', 4.8, false, true, NOW() - INTERVAL '20 days'),
('user4@example.com', '+79000000004', 'Бомбордиро', 'Крокодило', 'Пр-Пр-Патапимович', '$2b$12$0INxsLXfDmt0tkr9u4H28e8pWS.EtA.D7D6Ao.ZH4rUDYzuienbXG', 4.0, false, false, NOW() - INTERVAL '15 days'),
('user5@example.com', '+79000000005', 'Валерий', 'Жмышенко', 'Альбертович', '$2b$12$0INxsLXfDmt0tkr9u4H28e8pWS.EtA.D7D6Ao.ZH4rUDYzuienbXG', 4.6, false, true, NOW() - INTERVAL '10 days');

-- USER_ROLES
INSERT INTO user_roles (user_id, role, assigned_at) VALUES
(1, 'RENTER', NOW()),
(2, 'RENTER', NOW()),
(3, 'RENTER', NOW()),
(4, 'RENTER', NOW()),
(5, 'RENTER', NOW()),
(1, 'LANDLORD', NOW()),
(2, 'LANDLORD', NOW()),
(3, 'LANDLORD', NOW()),
(4, 'LANDLORD', NOW()),
(5, 'LANDLORD', NOW());



-- LISTINGS
INSERT INTO listings (user_id, type, title, description, price, price_period, currency, location, address, size, photo_urls, amenities, availability, status, views_count, reposts_count, favorites_count, created_at, updated_at) VALUES
-- Объявления пользователя 1 (13 объявления)
(1, 'GARAGE', 'Теплый гараж в центре', 'Просторный гараж с отоплением и охраной', 1500.00, 'DAY', 'RUB', ST_GeomFromText('POINT(37.6175 55.7558)', 4326), 'Москва, ул. Тверская, 1', 25.0, '[]', '{"security": true, "electricity": true}', ARRAY['[2026-01-01, 2026-03-31)', '[2026-06-15, 2026-08-10)']::tstzrange[], 'ACTIVE', 45, 3, 7, NOW() - INTERVAL '25 days', NOW()),
(1, 'PARKING', 'Парковочное место подземное', 'Охраняемая парковка в бизнес-центре', 500.00, 'DAY', 'RUB', ST_GeomFromText('POINT(37.6095 55.7539)', 4326), 'Москва, Пресненская наб., 12', 12.5, '[]', '{"security": true, "cctv": true}', ARRAY['[2025-12-15, 2026-02-10)', '[2026-03-01, 2026-05-20)']::tstzrange[], 'ACTIVE', 23, 1, 3, NOW() - INTERVAL '20 days', NOW()),
(1, 'STORAGE', 'Кладовка в жилом комплексе', 'Сухое помещение для хранения вещей', 300.00, 'MONTH', 'RUB', ST_GeomFromText('POINT(37.6254 55.7580)', 4326), 'Москва, ул. Новый Арбат, 15', 8.0, '[]', '{"dry": true}', ARRAY['[2026-02-28, 2026-04-05)', '[2026-05-01, 2026-06-25)']::tstzrange[], 'INACTIVE', 12, 0, 1, NOW() - INTERVAL '15 days', NOW()),
(1, 'GARAGE', 'Гараж с подвалом в САО', 'Просторный гараж с дополнительным подвальным помещением для хранения. Ворота автоматические.', 1800.00, 'DAY', 'RUB', ST_GeomFromText('POINT(37.5113 55.8387)', 4326), 'Москва, Коровинское шоссе, 35', 32.0, '[]', '{"security": true, "electricity": true, "heating": true, "automatic_gate": true}', ARRAY['[2026-01-10, 2026-03-20)', '[2026-05-01, 2026-07-15)']::tstzrange[], 'ACTIVE', 67, 2, 12, NOW() - INTERVAL '40 days', NOW()),
(1, 'PARKING', 'Уличное парковочное место у метро', 'Наземное место на охраняемой территории. Круглосуточный доступ. Видеонаблюдение.', 400.00, 'DAY', 'RUB', ST_GeomFromText('POINT(37.5832 55.7066)', 4326), 'Москва, ул. Профсоюзная, 98', 12.0, '[]', '{"security": true, "cctv": true, "lighting": true}', ARRAY['[2025-11-20, 2026-01-25)', '[2026-03-01, 2026-05-10)']::tstzrange[], 'ACTIVE', 89, 5, 15, NOW() - INTERVAL '35 days', NOW()),
(1, 'STORAGE', 'Отапливаемый склад в промзоне', 'Помещение для хранения товаров или оборудования. Высокие потолки, грузовой лифт, пандус.', 25000.00, 'MONTH', 'RUB', ST_GeomFromText('POINT(37.7430 55.7068)', 4326), 'Московская обл., г. Реутов, ул. Победы, 12', 120.0, '[]', '{"heating": true, "dry": true, "ventilation": true, "cargo_elevator": true}', ARRAY['[2026-02-15, 2026-04-30)', '[2026-06-10, 2026-08-20)']::tstzrange[], 'PENDING_APPROVAL', 154, 8, 22, NOW() - INTERVAL '50 days', NOW()),
(1, 'GARAGE', 'Эконом гараж в кооперативе "Мотор"', 'Без дополнительных удобств, но надежно. Общее ограждение по периметру, шлагбаум.', 800.00, 'DAY', 'RUB', ST_GeomFromText('POINT(37.4237 55.6767)', 4326), 'Москва, поселение Внуковское, Гаражный кооператив "Мотор"', 18.0, '[]', '{"fence": true}', ARRAY['[2025-12-01, 2026-02-28)', '[2026-04-01, 2026-06-01)']::tstzrange[], 'ACTIVE', 33, 1, 5, NOW() - INTERVAL '10 days', NOW()),
(1, 'PARKING', 'Крытый бокс в многоуровневом паркинге', 'Защищенное от осадков место на -2 уровне. Прямой доступ к лифтам в офисный центр.', 750.00, 'DAY', 'RUB', ST_GeomFromText('POINT(37.5352 55.7004)', 4326), 'Москва, Ленинский проспект, 123', 13.5, '[]', '{"security": true, "cctv": true, "covered": true, "elevator": true}', ARRAY['[2026-03-05, 2026-05-15)', '[2026-07-01, 2026-09-10)']::tstzrange[], 'ACTIVE', 121, 6, 31, NOW() - INTERVAL '60 days', NOW()),
(1, 'STORAGE', 'Малая кладовая в центре', 'Идеально для сезонных вещей или документов. Внутри сухого офисного здания.', 2000.00, 'MONTH', 'RUB', ST_GeomFromText('POINT(37.6029 55.7598)', 4326), 'Москва, ул. Большая Дмитровка, 10', 5.0, '[]', '{"dry": true, "security": true, "fire_alarm": true}', ARRAY['[2026-01-20, 2026-04-01)', '[2026-05-15, 2026-07-20)']::tstzrange[], 'INACTIVE', 45, 0, 8, NOW() - INTERVAL '70 days', NOW()),
(1, 'GARAGE', 'Гараж-мастерская с 380В', 'Отличный вариант для автослесаря или любителя. Подведено 3-фазное электричество, смотровая яма.', 2200.00, 'DAY', 'RUB', ST_GeomFromText('POINT(37.8565 55.3795)', 4326), 'Московская обл., г. Подольск, ул. Заводская, 7', 40.0, '[]', '{"electricity_3phase": true, "work_pit": true, "water_supply": true, "heating": false}', ARRAY['[2025-11-05, 2026-01-10)', '[2026-02-20, 2026-04-25)']::tstzrange[], 'ACTIVE', 187, 12, 45, NOW() - INTERVAL '55 days', NOW()),
(1, 'PARKING', 'Гостевой паркинг в ЖК "Солнечный"', 'Свободное место на придомовой территории. Разрешение от УК. Помесячная оплата.', 7000.00, 'MONTH', 'RUB', ST_GeomFromText('POINT(37.3908 55.9036)', 4326), 'Москва, р-н Митино, ул. Дубравная, 41', 15.0, '[]', '{"lighting": true}', ARRAY['[2026-02-01, 2026-04-10)', '[2026-06-01, 2026-08-15)']::tstzrange[], 'ACTIVE', 56, 3, 9, NOW() - INTERVAL '30 days', NOW()),
(1, 'STORAGE', 'Холодильный склад для продуктов', 'Помещение с поддержанием температуры +2..+6 °C. Подойдет для хранения цветов или небольших партий товара.', 45000.00, 'MONTH', 'RUB', ST_GeomFromText('POINT(37.4714 55.8231)', 4326), 'Москва, ул. Пришвина, 22', 25.0, '[]', '{"refrigeration": true, "security": true, "dry": true}', ARRAY['[2026-03-15, 2026-05-20)', '[2026-07-01, 2026-09-05)']::tstzrange[], 'PENDING_APPROVAL', 92, 4, 18, NOW() - INTERVAL '45 days', NOW()),
(1, 'PARKING', 'Эксклюзивное место под навесом', 'Рядом с коттеджем, частная территория, навес защищает от снега и сосулек. Полная конфиденциальность.', 1000.00, 'DAY', 'RUB', ST_GeomFromText('POINT(37.2632 55.7426)', 4326), 'Московская обл., Одинцовский р-н, с. Немчиновка', 16.0, '[]', '{"covered": true, "private": true, "lighting": true}', ARRAY['[2025-12-10, 2026-02-15)', '[2026-04-01, 2026-06-10)']::tstzrange[], 'ACTIVE', 23, 1, 4, NOW() - INTERVAL '5 days', NOW()),

-- Объявления пользователя 2 (2 объявления)
(2, 'GARAGE', 'Гараж в спальном районе', 'Небольшой гараж для легкового автомобиля', 800.00, 'DAY', 'RUB', ST_GeomFromText('POINT(37.7000 55.8000)', 4326), 'Москва, р-н Митино', 18.0, '[]', '{"lighting": true}', ARRAY['[2026-01-05, 2026-03-15)', '[2026-05-01, 2026-07-10)']::tstzrange[], 'ACTIVE', 34, 2, 5, NOW() - INTERVAL '18 days', NOW()),
(2, 'PARKING', 'Уличная парковка', 'Открытое парковочное место во дворе', 200.00, 'DAY', 'RUB', ST_GeomFromText('POINT(37.7100 55.8100)', 4326), 'Москва, р-н Отрадное', 15.0, '[]', '{}', ARRAY['[2026-02-20, 2026-04-25)', '[2026-06-10, 2026-08-20)']::tstzrange[], 'PENDING_APPROVAL', 8, 0, 0, NOW() - INTERVAL '10 days', NOW()),

-- Объявления пользователя 3 (4 объявления)
(3, 'STORAGE', 'Складское помещение', 'Помещение для хранения товаров', 2000.00, 'MONTH', 'RUB', ST_GeomFromText('POINT(37.6500 55.7000)', 4326), 'Москва, промзона Юг', 50.0, '[]', '{"security": true, "electricity": true, "heating": true}', ARRAY['[2025-11-15, 2026-01-20)', '[2026-03-01, 2026-05-10)']::tstzrange[], 'ACTIVE', 67, 5, 12, NOW() - INTERVAL '22 days', NOW()),
(3, 'GARAGE', 'Гаражный бокс премиум', 'Большой гараж для двух автомобилей', 2500.00, 'DAY', 'RUB', ST_GeomFromText('POINT(37.6200 55.7500)', 4326), 'Москва, Ленинский пр-т', 35.0, '[]', '{"security": true, "electricity": true, "water": true}', ARRAY['[2026-03-01, 2026-05-10)', '[2026-06-20, 2026-08-30)']::tstzrange[], 'REJECTED', 15, 0, 2, NOW() - INTERVAL '17 days', NOW()),
(3, 'PARKING', 'Парковка у метро', 'Удобное место рядом со станцией метро', 400.00, 'DAY', 'RUB', ST_GeomFromText('POINT(37.6300 55.7600)', 4326), 'Москва, возле м. Проспект Мира', 10.0, '[]', '{"cctv": true}', ARRAY['[2026-04-01, 2026-06-10)', '[2026-07-20, 2026-09-30)']::tstzrange[], 'ACTIVE', 89, 7, 15, NOW() - INTERVAL '12 days', NOW()),
(3, 'STORAGE', 'Небольшая кладовая', 'Для сезонных вещей и спортивного инвентаря', 150.00, 'MONTH', 'RUB', ST_GeomFromText('POINT(37.6400 55.7700)', 4326), 'Москва, р-н Коньково', 5.0, '[]', '{}', ARRAY['[2026-01-15, 2026-03-20)', '[2026-05-01, 2026-07-15)']::tstzrange[], 'DRAFT', 3, 0, 0, NOW() - INTERVAL '5 days', NOW()),

-- Объявления пользователя 4 (1 объявление)
(4, 'GARAGE', 'Эконом гараж', 'Бюджетный вариант для длительной аренды', 600.00, 'DAY', 'RUB', ST_GeomFromText('POINT(37.5800 55.7400)', 4326), 'Москва, р-н Бирюлево', 16.0, '[]', '{}', ARRAY['[2026-02-10, 2026-04-15)', '[2026-06-01, 2026-08-10)']::tstzrange[], 'ACTIVE', 28, 1, 4, NOW() - INTERVAL '14 days', NOW()),

-- Объявления пользователя 5 (5 объявлений)
(5, 'PARKING', 'VIP парковка', 'Привилегированное место с персональным обслуживанием', 1000.00, 'DAY', 'RUB', ST_GeomFromText('POINT(37.6000 55.7400)', 4326), 'Москва, р-н Хамовники', 14.0, '[]', '{"security": true, "valet": true, "washing": true}', ARRAY['[2025-12-20, 2026-02-25)', '[2026-04-10, 2026-06-20)']::tstzrange[], 'ACTIVE', 156, 12, 28, NOW() - INTERVAL '28 days', NOW()),
(5, 'STORAGE', 'Термосклад', 'Помещение с контролем температуры', 3500.00, 'MONTH', 'RUB', ST_GeomFromText('POINT(37.5900 55.7300)', 4326), 'Москва, промзона Запад', 40.0, '[]', '{"temperature_control": true, "security": true}', ARRAY['[2026-03-20, 2026-05-25)', '[2026-07-10, 2026-09-20)']::tstzrange[], 'ACTIVE', 72, 4, 9, NOW() - INTERVAL '21 days', NOW()),
(5, 'GARAGE', 'Гараж с мастерской', 'Идеально для авторемонтных работ', 1800.00, 'DAY', 'RUB', ST_GeomFromText('POINT(37.6100 55.7200)', 4326), 'Москва, р-н Нагатино', 30.0, '[]', '{"electricity": true, "tools": true, "compressor": true}', ARRAY['[2026-01-25, 2026-04-05)', '[2026-05-20, 2026-07-30)']::tstzrange[], 'ACTIVE', 94, 6, 11, NOW() - INTERVAL '16 days', NOW()),
(5, 'PARKING', 'Ночная парковка', 'Специальное предложение для ночной аренды', 150.00, 'HOUR', 'RUB', ST_GeomFromText('POINT(37.6200 55.7100)', 4326), 'Москва, р-н Донской', 11.0, '[]', '{"lighting": true}', ARRAY['[2025-11-25, 2026-01-30)', '[2026-03-15, 2026-05-25)']::tstzrange[], 'INACTIVE', 41, 2, 6, NOW() - INTERVAL '9 days', NOW()),
(5, 'STORAGE', 'Архивное хранение', 'Для документов и архивных материалов', 800.00, 'MONTH', 'RUB', ST_GeomFromText('POINT(37.6300 55.7000)', 4326), 'Москва, бизнес-центр Север', 12.0, '[]', '{"fireproof": true, "dry": true}', ARRAY['[2025-01-01, 2025-03-01)', '[2025-04-01, 2025-06-01)']::tstzrange[], 'PENDING_APPROVAL', 19, 1, 3, NOW() - INTERVAL '3 days', NOW());



-- BOOKINGS
INSERT INTO bookings (listing_id, renter_id, period, total_price, currency, status, created_at, updated_at) VALUES
-- Бронирования пользователя 1 (2 бронирования) для listing 4 и 7
(4, 1, '[2026-02-10, 2026-02-15)'::tstzrange, 9000.00, 'RUB', 'COMPLETED', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
(4, 1, '[2026-03-01, 2026-03-05)'::tstzrange, 7200.00, 'RUB', 'CONFIRMED', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
(7, 1, '[2026-02-20, 2026-02-25)'::tstzrange, 4000.00, 'RUB', 'COMPLETED', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
(7, 1, '[2026-04-10, 2026-04-15)'::tstzrange, 4000.00, 'RUB', 'CANCELLED', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

-- Бронирования пользователя 2 (1 бронирование) для listing 1
(1, 2, '[2026-01-15, 2026-01-20)'::tstzrange, 7500.00, 'RUB', 'COMPLETED', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
(1, 2, '[2026-02-20, 2026-02-25)'::tstzrange, 7500.00, 'RUB', 'CONFIRMED', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

-- Бронирования пользователя 3 (3 бронирования) для listing 11,13,14
(11, 3, '[2026-02-01, 2026-03-01)'::tstzrange, 7000.00, 'RUB', 'COMPLETED', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),
(11, 3, '[2026-06-01, 2026-07-01)'::tstzrange, 7000.00, 'RUB', 'CONFIRMED', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(13, 3, '[2026-01-10, 2026-02-10)'::tstzrange, 31000.00, 'RUB', 'COMPLETED', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
(13, 3, '[2026-04-01, 2026-05-01)'::tstzrange, 30000.00, 'RUB', 'CONFIRMED', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
(14, 3, '[2026-01-20, 2026-01-25)'::tstzrange, 4000.00, 'RUB', 'COMPLETED', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(14, 3, '[2026-02-20, 2026-02-25)'::tstzrange, 4000.00, 'RUB', 'CANCELLED', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),

-- Бронирования пользователя 5 (1 бронирование) для listing 9 (INACTIVE, только прошлое)
(9, 5, '[2026-01-20, 2026-02-20)'::tstzrange, 2000.00, 'RUB', 'COMPLETED', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days');



INSERT INTO reviews (booking_id, reviewer_id, rating, text, created_at) VALUES
(1, 1, 5, 'Отличный гараж, все чисто и аккуратно. Хозяин приятный в общении, помог с заселением. Рекомендую!', NOW() - INTERVAL '18 days'),
(7, 3, 4, 'VIP парковка соответствует описанию. Место удобное, охраняемая территория. Минус - дороговато, но качество на уровне.', NOW() - INTERVAL '10 days'),
(5, 2, 4, 'Гараж теплый, как и обещали. Небольшие проблемы с замком, но быстро починили. В целом доволен.', NOW() - INTERVAL '22 days'),
(3, 1, 5, 'Отличная парковка у метро! Очень удобное расположение, всегда есть свободные места. 5 звезд!', NOW() - INTERVAL '12 days'),
(9, 3, 4, 'Гараж с мастерской - то что нужно! Все инструменты в наличии, электричество стабильное. Спасибо!', NOW() - INTERVAL '8 days'),
(13, 5, 5, 'Термосклад идеален для хранения продуктов! Температура поддерживается точно. Профессионально!', NOW() - INTERVAL '4 days');



-- WALLETS
INSERT INTO wallets (user_id, updated_at) VALUES
(1, NOW()),
(2, NOW()),
(3, NOW()),
(4, NOW()),
(5, NOW());


-- WALLET_BALANCES
INSERT INTO wallet_balances (wallet_id, balance, currency) VALUES
-- Пользователь 1: RUB и USDT
(1, 15000.50, 'RUB'),
(1, 500.123456789, 'USDT'),

-- Пользователь 2: RUB и USD
(2, 8000.00, 'RUB'),
(2, 100.25, 'USD'),

-- Пользователь 3: RUB, USDT и ETH
(3, 25000.00, 'RUB'),
(3, 1500.123456789, 'USDT'),
(3, 2.123456789, 'ETH'),

-- Пользователь 4: только RUB
(4, 3000.00, 'RUB'),

-- Пользователь 5: RUB, USD, USDT, ETH, TRX
(5, 50000.00, 'RUB'),
(5, 500.00, 'USD'),
(5, 5000.123456789, 'USDT'),
(5, 10.123456789, 'ETH'),
(5, 1000.123456789, 'TRX');



-- SUBSCRIPTION_PLANS
INSERT INTO subscription_plans (name, price, currency, max_listings, priority_search, boosts_per_month, description, extra_features) VALUES
('Basic', 0.00, 'RUB', 3, false, 1, 'Базовый тариф для начала работы', '{"basic_support": true}'),
('Pro', 500.00, 'RUB', 10, true, 5, 'Профессиональный тариф для активных арендодателей', '{"priority_support": true, "analytics": true}'),
('Business', 1500.00, 'RUB', 50, true, 20, 'Бизнес-тариф для коммерческого использования', '{"premium_support": true, "advanced_analytics": true, "api_access": true}'),
('Crypto Pro', 15.123456789, 'USDT', 15, true, 10, 'Про тариф с оплатой криптовалютой', '{"crypto_payments": true, "priority_support": true}');



-- USER_SUBSCRIPTIONS
INSERT INTO user_subscriptions (user_id, plan_id, start_date, end_date, status, created_at, updated_at) VALUES
-- Пользователь 1: Pro подписка (активная)
(1, 2, NOW() - INTERVAL '30 days', NOW() + INTERVAL '30 days', 'ACTIVE', NOW() - INTERVAL '30 days', NOW()),
-- Пользователь 2: Pro подписка (истекла)
(2, 2, NOW() - INTERVAL '60 days', NOW() - INTERVAL '10 days', 'EXPIRED', NOW() - INTERVAL '60 days', NOW() - INTERVAL '10 days'),
-- Пользователь 3: Business подписка (активная)
(3, 3, NOW() - INTERVAL '15 days', NOW() + INTERVAL '45 days', 'ACTIVE', NOW() - INTERVAL '15 days', NOW()),
-- Пользователь 4: Basic подписка (активная)
(4, 1, NOW() - INTERVAL '5 days', NULL, 'ACTIVE', NOW() - INTERVAL '5 days', NOW()),
-- Пользователь 5: Crypto Pro подписка (активная)
(5, 4, NOW() - INTERVAL '7 days', NOW() + INTERVAL '23 days', 'ACTIVE', NOW() - INTERVAL '7 days', NOW());



-- TRANSACTIONS
INSERT INTO transactions (wallet_id, type, amount, currency, status, booking_id, commission, description, gateway_transaction_id, created_at) VALUES
-- Транзакции пользователя 1
(1, 'TOPUP', 20000.00, 'RUB', 'COMPLETED', NULL, 0.00, 'Пополнение с банковской карты', 'card_txn_001', NOW() - INTERVAL '35 days'),
(1, 'CHARGE', 500.00, 'RUB', 'COMPLETED', 1, 50.00, 'Оплата подписки Pro', 'sub_txn_001', NOW() - INTERVAL '30 days'),
(1, 'COMMISSION', 50.00, 'RUB', 'COMPLETED', 1, 0.00, 'Комиссия платформы за бронирование #1', 'comm_txn_001', NOW() - INTERVAL '20 days'),
(1, 'CHARGE', 3200.00, 'RUB', 'COMPLETED', 1, 320.00, 'Оплата бронирования #1', 'book_txn_001', NOW() - INTERVAL '20 days'),
(1, 'TOPUP', 1000.123456789, 'USDT', 'COMPLETED', NULL, 0.123456789, 'Пополнение USDT', 'crypto_txn_001', NOW() - INTERVAL '10 days'),

-- Транзакции пользователя 2
(2, 'TOPUP', 10000.00, 'RUB', 'COMPLETED', NULL, 0.00, 'Пополнение через СБП', 'sbp_txn_001', NOW() - INTERVAL '65 days'),
(2, 'CHARGE', 500.00, 'RUB', 'COMPLETED', NULL, 0.00, 'Оплата подписки Pro', 'sub_txn_002', NOW() - INTERVAL '60 days'),
(2, 'PAYOUT', 1500.00, 'RUB', 'COMPLETED', NULL, 15.00, 'Вывод средств на карту', 'payout_txn_001', NOW() - INTERVAL '40 days'),

-- Транзакции пользователя 3
(3, 'TOPUP', 30000.00, 'RUB', 'COMPLETED', NULL, 0.00, 'Пополнение счета', 'card_txn_002', NOW() - INTERVAL '20 days'),
(3, 'TOPUP', 2000.123456789, 'USDT', 'COMPLETED', NULL, 0.00, 'Пополнение USDT', 'crypto_txn_002', NOW() - INTERVAL '18 days'),
(3, 'CHARGE', 1500.00, 'RUB', 'COMPLETED', NULL, 0.00, 'Оплата подписки Business', 'sub_txn_003', NOW() - INTERVAL '15 days'),
(3, 'COMMISSION', 100.00, 'RUB', 'COMPLETED', 4, 0.00, 'Комиссия за бронирование #4', 'comm_txn_002', NOW() - INTERVAL '12 days'),
(3, 'CHARGE', 1000.00, 'RUB', 'COMPLETED', 4, 100.00, 'Оплата бронирования #4', 'book_txn_002', NOW() - INTERVAL '12 days'),

-- Транзакции пользователя 4
(4, 'TOPUP', 5000.00, 'RUB', 'COMPLETED', NULL, 0.00, 'Пополнение счета', 'card_txn_003', NOW() - INTERVAL '10 days'),
(4, 'CHARGE', 0.00, 'RUB', 'COMPLETED', NULL, 0.00, 'Активация Basic подписки', 'sub_txn_004', NOW() - INTERVAL '5 days'),

-- Транзакции пользователя 5
(5, 'TOPUP', 60000.00, 'RUB', 'COMPLETED', NULL, 0.00, 'Пополнение бизнес-счета', 'card_txn_004', NOW() - INTERVAL '30 days'),
(5, 'TOPUP', 20.123456789, 'ETH', 'COMPLETED', NULL, 0.123456789, 'Пополнение ETH', 'crypto_txn_003', NOW() - INTERVAL '25 days'),
(5, 'CHARGE', 15.123456789, 'USDT', 'COMPLETED', NULL, 0.123456789, 'Оплата Crypto Pro подписки', 'sub_txn_005', NOW() - INTERVAL '7 days'),
(5, 'COMMISSION', 400.00, 'RUB', 'COMPLETED', 6, 0.00, 'Комиссия за бронирование #6', 'comm_txn_003', NOW() - INTERVAL '16 days'),
(5, 'CHARGE', 4000.00, 'RUB', 'COMPLETED', 6, 400.00, 'Оплата бронирования #6', 'book_txn_003', NOW() - INTERVAL '16 days'),
(5, 'PAYOUT', 10000.00, 'RUB', 'COMPLETED', NULL, 100.00, 'Вывод дохода', 'payout_txn_002', NOW() - INTERVAL '5 days');



-- CONVERSATIONS
INSERT INTO conversations (participant1_id, participant2_id, listing_id, last_message_at, created_at, updated_at) VALUES
-- Чат между пользователем 1 и пользователем 2 по бронированию гаража
(1, 2, 4, NOW() - INTERVAL '18 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days'),
-- Чат между пользователем 1 и пользователем 3 по парковке у метро
(1, 3, 9, NOW() - INTERVAL '10 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days'),
-- Чат между пользователем 2 и пользователем 5 по термоскладу
(2, 5, 13, NOW() - INTERVAL '3 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '3 days'),
-- Чат между пользователем 3 и пользователем 5 по VIP парковке
(3, 5, 11, NOW() - INTERVAL '8 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '8 days'),
-- Чат между пользователем 4 и пользователем 5 по гаражу с мастерской
(4, 5, 12, NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days'),
-- Чат между пользователем 1 и пользователем 5 (общий, без привязки к объявлению)
(1, 5, NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 days');



-- MESSAGES
INSERT INTO messages (conversation_id, sender_id, text, is_read, sent_at, read_at, updated_at) VALUES
-- Сообщения в чате 1 (пользователи 1 и 2)
(1, 1, 'Здравствуйте! Интересует ваш гараж в Митино. Можно посмотреть сегодня?', true, NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '20 days'),
(1, 2, 'Добрый день! Да, конечно. В 18:00 вам подойдет?', true, NOW() - INTERVAL '19 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '19 days'),
(1, 1, 'Отлично! Приеду в 18:00. Скините точный адрес, пожалуйста.', true, NOW() - INTERVAL '19 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '19 days'),
(1, 2, 'Москва, р-н Митино, ул. Митинская, 25. Буду ждать!', true, NOW() - INTERVAL '19 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '19 days'),
(1, 1, 'Спасибо! Отличный гараж, бронирую на даты 1-5 февраля.', true, NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '18 days'),

-- Сообщения в чате 2 (пользователи 1 и 3)
(2, 1, 'Привет! Парковка у метро еще доступна? Нужно на 10-12 февраля.', true, NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '15 days'),
(2, 3, 'Да, свободна. Можете забронировать в приложении.', true, NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days', NOW() - INTERVAL '14 days'),
(2, 1, 'Есть ли скидка за 3 дня?', true, NOW() - INTERVAL '13 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '13 days'),
(2, 3, 'К сожалению, цена фиксированная. Но место очень удобное!', true, NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days', NOW() - INTERVAL '12 days'),
(2, 1, 'Хорошо, бронирую. Спасибо!', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '10 days'),

-- Сообщения в чате 3 (пользователи 2 и 5)
(3, 2, 'Здравствуйте! Про термосклад: какая температура поддерживается?', true, NOW() - INTERVAL '12 days', NOW() - INTERVAL '11 days', NOW() - INTERVAL '12 days'),
(3, 5, 'Добрый день! Температурный режим +2...+8°C. Есть система мониторинга.', true, NOW() - INTERVAL '11 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '11 days'),
(3, 2, 'Подойдет для хранения заморозки? Нужно -18°C.', false, NOW() - INTERVAL '5 days', NULL, NOW() - INTERVAL '5 days'),
(3, 5, 'К сожалению, нет. У нас только плюсовой режим.', true, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days'),
(3, 2, 'Понятно, спасибо за информацию!', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days'),

-- Сообщения в чате 4 (пользователи 3 и 5)
(4, 3, 'Привет! VIP парковка: есть ли видеонаблюдение?', true, NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '18 days'),
(4, 5, 'Да, круглосуточное видеонаблюдение и охрана.', true, NOW() - INTERVAL '17 days', NOW() - INTERVAL '16 days', NOW() - INTERVAL '17 days'),
(4, 3, 'Отлично! А мойка входит в стоимость?', true, NOW() - INTERVAL '16 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '16 days'),
(4, 5, 'Да, одна бесплатная мойка за каждые 7 дней аренды.', true, NOW() - INTERVAL '15 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '15 days'),
(4, 3, 'Супер! Бронирую на 3-4 февраля.', true, NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days', NOW() - INTERVAL '14 days'),
(4, 5, 'Ждем вас! Не забудьте документы на автомобиль.', true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '8 days'),

-- Сообщения в чате 5 (пользователи 4 и 5)
(5, 4, 'Здравствуйте! Гараж с мастерской: есть ли розетки 380В?', true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '10 days'),
(5, 5, 'Да, есть одна розетка 380В для компрессора.', true, NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '9 days'),
(5, 4, 'Отлично! А инструменты можно использовать?', true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '8 days'),
(5, 5, 'Да, весь инструмент входит в стоимость аренды.', true, NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '7 days'),
(5, 4, 'Прекрасно! Приеду посмотреть в субботу.', true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days'),

-- Сообщения в чате 6 (пользователи 1 и 5 - общий чат)
(6, 1, 'Привет! Есть вопросы по работе платформы.', true, NOW() - INTERVAL '25 days', NOW() - INTERVAL '24 days', NOW() - INTERVAL '25 days'),
(6, 5, 'Задавайте, я администратор, помогу.', true, NOW() - INTERVAL '24 days', NOW() - INTERVAL '23 days', NOW() - INTERVAL '24 days'),
(6, 1, 'Как продлить подписку Pro?', true, NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', NOW() - INTERVAL '20 days'),
(6, 5, 'В разделе "Подписка" есть кнопка "Продлить".', true, NOW() - INTERVAL '19 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '19 days'),
(6, 1, 'Спасибо! Разобрался.', true, NOW() - INTERVAL '18 days', NOW() - INTERVAL '17 days', NOW() - INTERVAL '18 days'),
(6, 1, 'Еще вопрос: когда придут деньги за бронирование?', false, NOW() - INTERVAL '5 days', NULL, NOW() - INTERVAL '5 days'),
(6, 5, 'Обычно в течение 3 рабочих дней после завершения бронирования.', true, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days'),
(6, 1, 'Понял, спасибо!', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 days', NOW() - INTERVAL '2 days');
