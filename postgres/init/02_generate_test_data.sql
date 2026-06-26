-- USERS
INSERT INTO users (phone, email, first_name, last_name, patronymic, password_hash, renter_rating, landlord_rating, renter_review_count, landlord_review_count, two_fa_enabled, verified, created_at, avatar_url) VALUES
('+79000000001', 'user1@example.com', 'Данил', 'Джонсон', 'Скала', '$2b$12$0INxsLXfDmt0tkr9u4H28e8pWS.EtA.D7D6Ao.ZH4rUDYzuienbXG', 4.5, 4.9, 6, 15, false, true, NOW() - INTERVAL '30 days', 'https://downloader.disk.yandex.ru/preview/95e63ad90f594474691f2c4476a793f2b0d8b1a1649ecf71779bf5483e0969c4/6a396ea6/qsHx75m4M-xqjM56GRq7exrAuziLAQGWgoGKCzMkK_4xhn5TF3hYUZX2dYj4lgpOE-MKoceUSG3PTbkUuijX5Q%3D%3D?uid=0&filename=%D0%A1%D0%BA%D0%B0%D0%BB%D0%B0.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=0&tknv=v3&is_direct_zip_experiment=1&size=1910x992'),
('+79000000002', 'user2@example.com', 'Тимур', 'Круз', 'Итанович', '$2b$12$0INxsLXfDmt0tkr9u4H28e8pWS.EtA.D7D6Ao.ZH4rUDYzuienbXG', 4.2, 4.8, 5, 7, false, false, NOW() - INTERVAL '25 days', 'https://downloader.disk.yandex.ru/preview/0284e628e435a51a21ded7727645016f0d6d3154b15f03b82be8cfd3fbf20445/6a395527/5JbPLJ2xt-tzNJOhkCIRxXz0bcICof7tXpKV4EBuLkOA4GrFEjR0nXCCt7uwwO2sUdxhfnB7QO-Pimld0OlQSg%3D%3D?uid=0&filename=%D0%9A%D1%80%D1%83%D0%B7.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=0&tknv=v3&is_direct_zip_experiment=1&size=1910x992'),
('+79000000003', 'user3@example.com', 'Меган', 'Фокс', 'Эдуардовна', '$2b$12$0INxsLXfDmt0tkr9u4H28e8pWS.EtA.D7D6Ao.ZH4rUDYzuienbXG', 4.8, 4.1, 5, 6, false, true, NOW() - INTERVAL '20 days', 'https://downloader.disk.yandex.ru/preview/b82412bbdef37b4c2d1a125d4664faef46d03c885d02808bedc4082b959bdda2/6a395527/8XSxrSkIlpQ7hw91Te1PsXz0bcICof7tXpKV4EBuLkOzs8d_wtNmC25OvYuc7xobqcaY5mLNYnGiiKcC8O1NdA%3D%3D?uid=0&filename=%D0%9C%D0%B5%D0%B3%D0%B0%D0%BD.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=0&tknv=v3&is_direct_zip_experiment=1&size=1910x992'),
('+79000000004', 'user4@example.com', 'Женя', 'Керри', 'Труманович', '$2b$12$0INxsLXfDmt0tkr9u4H28e8pWS.EtA.D7D6Ao.ZH4rUDYzuienbXG', 4.0, 4.7, 7, 4, false, false, NOW() - INTERVAL '15 days', 'https://downloader.disk.yandex.ru/preview/6fed2ad019fd6be05022e460aa121686014d4835f8096303519df16052a506f6/6a395527/iI8agNbVfQi8ectyKkxtrHz0bcICof7tXpKV4EBuLkOJUFiG_3m-rBV1y8UjyCwJ6c0s-71MqgbStnhTj9zCJw%3D%3D?uid=0&filename=%D0%9A%D0%B5%D1%80%D1%80%D0%B8.jpg&disposition=inline&hash=&limit=0&content_type=image%2Fjpeg&owner_uid=0&tknv=v3&is_direct_zip_experiment=1&size=1910x992'),
('+79000000005', 'user5@example.com', 'Женя', 'Стетхем', 'Механикович', '$2b$12$0INxsLXfDmt0tkr9u4H28e8pWS.EtA.D7D6Ao.ZH4rUDYzuienbXG', 4.6, 4.5, 5, 3, false, true, NOW() - INTERVAL '10 days', 'https://downloader.disk.yandex.ru/preview/44d67d42e28b1800c0d355f78ec874d5945efbedc4c287b1f6a716a8d902f9a5/6a395527/Ql87O3UftKPKzLGRPD5fkMBHgkm91Q8_VtAb8yfyiD2wqVepZMLmzRTnnkQVaLkvW7izVTrDyGrJx_MZ6O8dsQ%3D%3D?uid=0&filename=%D0%A1%D1%82%D0%B5%D1%82%D1%85%D0%B5%D0%BC.png&disposition=inline&hash=&limit=0&content_type=image%2Fpng&owner_uid=0&tknv=v3&is_direct_zip_experiment=1&size=1910x992');



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
INSERT INTO listings (user_id, type, title, description, location, address, size, photo_urls, amenities, availability, status, views_count, reposts_count, favorites_count, created_at, updated_at) VALUES
-- Объявления пользователя 1 (13 объявления)
(1, 'GARAGE', 'Теплый гараж в центре', 'Просторный гараж с отоплением и охраной', ST_GeomFromText('POINT(37.6175 55.7558)', 4326), 'Москва, ул. Тверская, 1', 25.0, '["https://img.dmclk.ru/c960x640q80/vitrina/owner/71/73/7173292f47c947bb8e49c47797e8ef7e.jpg"]', ARRAY['SECURITY', 'ELECTRICITY']::space_amenity[], ARRAY['[2026-01-01, 2026-01-15)', '[2026-01-20, 2026-02-20)', '[2026-02-25, 2026-03-31)', '[2026-06-15, 2026-08-10)']::tstzrange[], 'ACTIVE', 45, 3, 7, NOW() - INTERVAL '25 days', NOW()),
(1, 'PARKING', 'Парковочное место подземное', 'Охраняемая парковка в бизнес-центре', ST_GeomFromText('POINT(37.6095 55.7539)', 4326), 'Москва, Пресненская наб., 12', 12.5, '["https://protectof.by/image/catalog/2023/znaki/20180622_120514.jpg"]', ARRAY['SECURITY', 'VIDEO_SURVEILLANCE']::space_amenity[], ARRAY['[2025-12-15, 2026-02-10)', '[2026-03-01, 2026-05-20)']::tstzrange[], 'ACTIVE', 23, 1, 3, NOW() - INTERVAL '20 days', NOW()),
(1, 'STORAGE', 'Кладовка в жилом комплексе', 'Сухое помещение для хранения вещей', ST_GeomFromText('POINT(37.6254 55.7580)', 4326), 'Москва, ул. Новый Арбат, 15', 8.0, '["https://cdn.pronovostroy.ru/object/2021-10-12/616583ad64d1e413b747c50d/images/61658449d55a2.jpeg"]', ARRAY['VENTILATION']::space_amenity[], ARRAY['[2026-02-28, 2026-04-05)', '[2026-05-01, 2026-06-25)']::tstzrange[], 'INACTIVE', 12, 0, 1, NOW() - INTERVAL '15 days', NOW()),
(1, 'GARAGE', 'Гараж с подвалом в САО', 'Просторный гараж с дополнительным подвальным помещением для хранения. Ворота автоматические.', ST_GeomFromText('POINT(37.5113 55.8387)', 4326), 'Москва, Коровинское шоссе, 35', 32.0, '["https://img.dmclk.ru/c960x640q80/vitrina/7e/c2/7ec22430e9f54d5f9e8992d571e46734199c4217.jpg"]', ARRAY['SECURITY', 'ELECTRICITY', 'HEATING']::space_amenity[], ARRAY['[2026-01-10, 2026-02-10)', '[2026-02-15, 2026-03-01)', '[2026-03-05, 2026-03-20)', '[2026-05-01, 2026-07-15)']::tstzrange[], 'ACTIVE', 67, 2, 12, NOW() - INTERVAL '40 days', NOW()),
(1, 'PARKING', 'Уличное парковочное место у метро', 'Наземное место на охраняемой территории. Круглосуточный доступ. Видеонаблюдение.', ST_GeomFromText('POINT(37.5832 55.7066)', 4326), 'Москва, ул. Профсоюзная, 98', 12.0, '["https://s15.stc.yc.kpcdn.net/share/i/12/8784984/wr-960.webp"]', ARRAY['SECURITY', 'VIDEO_SURVEILLANCE', 'ELECTRICITY']::space_amenity[], ARRAY['[2025-11-20, 2026-01-25)', '[2026-03-01, 2026-05-10)']::tstzrange[], 'ACTIVE', 89, 5, 15, NOW() - INTERVAL '35 days', NOW()),
(1, 'STORAGE', 'Отапливаемый склад в промзоне', 'Помещение для хранения товаров или оборудования. Высокие потолки, грузовой лифт, пандус.', ST_GeomFromText('POINT(37.7430 55.7068)', 4326), 'Московская обл., г. Реутов, ул. Победы, 12', 120.0, '["https://skladoiskatel.ru/images/sobipro/entries/159665/img_IMG_20240619_125331.jpg"]', ARRAY['HEATING', 'VENTILATION']::space_amenity[], ARRAY['[2026-02-15, 2026-04-30)', '[2026-06-10, 2026-08-20)']::tstzrange[], 'PENDING_APPROVAL', 154, 8, 22, NOW() - INTERVAL '50 days', NOW()),
(1, 'GARAGE', 'Эконом гараж в кооперативе "Мотор"', 'Без дополнительных удобств, но надежно. Общее ограждение по периметру, шлагбаум.', ST_GeomFromText('POINT(37.4237 55.6767)', 4326), 'Москва, поселение Внуковское, Гаражный кооператив "Мотор"', 18.0, '["https://i2.olan.ru/system/photos/entity/001/537/564/735/medium/img.jpg"]', ARRAY['SECURITY']::space_amenity[], ARRAY['[2025-12-01, 2026-02-20)', '[2026-02-25, 2026-02-28)', '[2026-04-01, 2026-04-10)', '[2026-04-15, 2026-06-01)']::tstzrange[], 'ACTIVE', 33, 1, 5, NOW() - INTERVAL '10 days', NOW()),
(1, 'PARKING', 'Крытый бокс в многоуровневом паркинге', 'Защищенное от осадков место на -2 уровне. Прямой доступ к лифтам в офисный центр.', ST_GeomFromText('POINT(37.5352 55.7004)', 4326), 'Москва, Ленинский проспект, 123', 13.5, '["https://бесплатныеобъявления.рф/photos/395626_1_b.JPG"]', ARRAY['SECURITY', 'VIDEO_SURVEILLANCE']::space_amenity[], ARRAY['[2026-03-05, 2026-05-15)', '[2026-07-01, 2026-09-10)']::tstzrange[], 'ACTIVE', 121, 6, 31, NOW() - INTERVAL '60 days', NOW()),
(1, 'STORAGE', 'Малая кладовая в центре', 'Идеально для сезонных вещей или документов. Внутри сухого офисного здания.', ST_GeomFromText('POINT(37.6029 55.7598)', 4326), 'Москва, ул. Большая Дмитровка, 10', 5.0, '["https://safe-box.ru/upload/iblock/745/ho2uf1wo3h7n8tl8v4qjhbi2x8viixmn.JPG"]', ARRAY['SECURITY', 'VENTILATION']::space_amenity[], ARRAY['[2026-02-20, 2026-04-01)', '[2026-05-15, 2026-07-20)']::tstzrange[], 'INACTIVE', 45, 0, 8, NOW() - INTERVAL '70 days', NOW()),
(1, 'GARAGE', 'Гараж-мастерская с 380В', 'Отличный вариант для автослесаря или любителя. Подведено 3-фазное электричество, смотровая яма.', ST_GeomFromText('POINT(37.8565 55.3795)', 4326), 'Московская обл., г. Подольск, ул. Заводская, 7', 40.0, '["https://sankt-peterburg.garage.doorhan.ru/assets/img/sale/garazh-masterskaya-6m.jpg"]', ARRAY['ELECTRICITY', 'WATER_SUPPLY']::space_amenity[], ARRAY['[2025-11-05, 2026-01-10)', '[2026-02-20, 2026-04-25)']::tstzrange[], 'ACTIVE', 187, 12, 45, NOW() - INTERVAL '55 days', NOW()),
(1, 'PARKING', 'Гостевой паркинг в ЖК "Солнечный"', 'Свободное место на придомовой территории. Разрешение от УК. Помесячная оплата.', ST_GeomFromText('POINT(37.3908 55.9036)', 4326), 'Москва, р-н Митино, ул. Дубравная, 41', 15.0, '["https://blog.idn500.ru/upload/iblock/4f4/gsxmudwjr70mhbgt1aclv1htqw0wtsgi/organizatsiya_gostevykh_parkovok_na_pridomovykh_territoriyakh_2_.jpg"]', ARRAY['ELECTRICITY']::space_amenity[], ARRAY['[2026-03-01, 2026-04-10)', '[2026-07-01, 2026-08-15)']::tstzrange[], 'ACTIVE', 56, 3, 9, NOW() - INTERVAL '30 days', NOW()),
(1, 'STORAGE', 'Холодильный склад для продуктов', 'Помещение с поддержанием температуры +2..+6 °C. Подойдет для хранения цветов или небольших партий товара.', ST_GeomFromText('POINT(37.4714 55.8231)', 4326), 'Москва, ул. Пришвина, 22', 25.0, '["https://www.shutterstock.com/image-illustration/refrigeration-warehouse-food-metal-shelves-260nw-2628019579.jpg"]', ARRAY['SECURITY', 'VENTILATION']::space_amenity[], ARRAY['[2026-03-15, 2026-05-20)', '[2026-07-01, 2026-09-05)']::tstzrange[], 'PENDING_APPROVAL', 92, 4, 18, NOW() - INTERVAL '45 days', NOW()),
(1, 'PARKING', 'Эксклюзивное место под навесом', 'Рядом с коттеджем, частная территория, навес защищает от снега и сосулек. Полная конфиденциальность.', ST_GeomFromText('POINT(37.2632 55.7426)', 4326), 'Московская обл., Одинцовский р-н, с. Немчиновка', 16.0, '["https://v-besedke.com/upload/iblock/d15/duq7hthtvymbjgqawpdetffbj51ewe38/naves_minimalizm_iz_dereva_otto_n_34.JPG"]', ARRAY['SECURITY', 'ELECTRICITY']::space_amenity[], ARRAY['[2025-12-10, 2026-01-10)', '[2026-02-10, 2026-02-15)', '[2026-04-01, 2026-06-10)']::tstzrange[], 'ACTIVE', 23, 1, 4, NOW() - INTERVAL '5 days', NOW()),

-- Объявления пользователя 2 (2 объявления)
(2, 'GARAGE', 'Гараж в спальном районе', 'Небольшой гараж для легкового автомобиля', ST_GeomFromText('POINT(37.7000 55.8000)', 4326), 'Москва, р-н Митино', 18.0, '["https://cdn.esoft.digital/320240/cluster/photos/cc/a0/ae619a08ffa2a301aaeb8d0146ec1dd146a8a0cc.jpeg"]', ARRAY['ELECTRICITY']::space_amenity[], ARRAY['[2026-01-05, 2026-01-20)', '[2026-01-25, 2026-02-20)', '[2026-02-25, 2026-03-15)', '[2026-05-01, 2026-07-10)']::tstzrange[], 'ACTIVE', 34, 2, 5, NOW() - INTERVAL '18 days', NOW()),
(2, 'PARKING', 'Уличная парковка', 'Открытое парковочное место во дворе', ST_GeomFromText('POINT(37.7100 55.8100)', 4326), 'Москва, р-н Отрадное', 15.0, '["https://img.freepik.com/free-photo/empty-parking-lot-parking-lane-outdoor-public-park_1127-3309.jpg"]', NULL, ARRAY['[2026-02-20, 2026-04-25)', '[2026-06-10, 2026-08-20)']::tstzrange[], 'PENDING_APPROVAL', 8, 0, 0, NOW() - INTERVAL '10 days', NOW()),

-- Объявления пользователя 3 (4 объявления)
(3, 'STORAGE', 'Складское помещение', 'Помещение для хранения товаров', ST_GeomFromText('POINT(37.6500 55.7000)', 4326), 'Москва, промзона Юг', 50.0, '["https://minisklad.storage.yandexcloud.net/store/infopage/81/headline_image/8d1fbf1236beaf3fe5dec293327e92b6.jpg"]', ARRAY['SECURITY', 'ELECTRICITY', 'HEATING']::space_amenity[], ARRAY['[2025-11-15, 2026-01-20)', '[2026-03-01, 2026-05-10)']::tstzrange[], 'ACTIVE', 67, 5, 12, NOW() - INTERVAL '22 days', NOW()),
(3, 'GARAGE', 'Гаражный бокс премиум', 'Большой гараж для двух автомобилей', ST_GeomFromText('POINT(37.6200 55.7500)', 4326), 'Москва, Ленинский пр-т', 35.0, '["https://rusnavesy.ru/upload/resize_cache/iblock/2e6/rtv9hyrxftgt18wse91p9dw6djcgcxge/1920_1080_126cda647948cbc99274de399e36e8734/1_02.jpg"]', ARRAY['SECURITY', 'ELECTRICITY', 'WATER_SUPPLY']::space_amenity[], ARRAY['[2026-03-01, 2026-05-10)', '[2026-06-20, 2026-08-30)']::tstzrange[], 'REJECTED', 15, 0, 2, NOW() - INTERVAL '17 days', NOW()),
(3, 'PARKING', 'Парковка у метро', 'Удобное место рядом со станцией метро', ST_GeomFromText('POINT(37.6300 55.7600)', 4326), 'Москва, возле м. Проспект Мира', 10.0, '["https://s09.stc.yc.kpcdn.net/share/i/12/12944116/wr-960.webp"]', ARRAY['VIDEO_SURVEILLANCE']::space_amenity[], ARRAY['[2026-04-01, 2026-06-10)', '[2026-07-20, 2026-09-30)']::tstzrange[], 'ACTIVE', 89, 7, 15, NOW() - INTERVAL '12 days', NOW()),
(3, 'STORAGE', 'Небольшая кладовая', 'Для сезонных вещей и спортивного инвентаря', ST_GeomFromText('POINT(37.6400 55.7700)', 4326), 'Москва, р-н Коньково', 5.0, '["https://newphoto.club/uploads/posts/2022-11/1668321056_2-newphoto-club-p-obustroit-kladovku-v-kvartire-svoimi-rukam-2.jpg"]', NULL, ARRAY['[2026-01-15, 2026-03-20)', '[2026-05-01, 2026-07-15)']::tstzrange[], 'DRAFT', 3, 0, 0, NOW() - INTERVAL '5 days', NOW()),

-- Объявления пользователя 4 (1 объявление)
(4, 'GARAGE', 'Эконом гараж', 'Бюджетный вариант для длительной аренды', ST_GeomFromText('POINT(37.5800 55.7400)', 4326), 'Москва, р-н Бирюлево', 16.0, '["https://skoggy.ru/sites/default/files/inline-images/1634.jpg"]', '{}', ARRAY['[2026-02-10, 2026-04-15)', '[2026-06-01, 2026-08-10)']::tstzrange[], 'ACTIVE', 28, 1, 4, NOW() - INTERVAL '14 days', NOW()),

-- Объявления пользователя 5 (5 объявлений)
(5, 'PARKING', 'VIP парковка', 'Привилегированное место с персональным обслуживанием', ST_GeomFromText('POINT(37.6000 55.7400)', 4326), 'Москва, р-н Хамовники', 14.0, '["https://images.squarespace-cdn.com/content/v1/590af64b37c581152910bea4/1541507974932-WJ140BH28H7FNNEI05WT/WN9A0023.jpg"]', ARRAY['SECURITY', 'WATER_SUPPLY']::space_amenity[], ARRAY['[2025-12-20, 2026-02-25)', '[2026-04-10, 2026-06-20)']::tstzrange[], 'ACTIVE', 156, 12, 28, NOW() - INTERVAL '28 days', NOW()),
(5, 'STORAGE', 'Термосклад', 'Помещение с контролем температуры', ST_GeomFromText('POINT(37.5900 55.7300)', 4326), 'Москва, промзона Запад', 40.0, '["https://www.rsholod.ru/images/stroitelstvo-mini-skladov-rsholod-4-s.jpg"]', ARRAY['HEATING', 'VENTILATION', 'SECURITY']::space_amenity[], ARRAY['[2026-03-20, 2026-05-25)', '[2026-07-10, 2026-09-20)']::tstzrange[], 'ACTIVE', 72, 4, 9, NOW() - INTERVAL '21 days', NOW()),
(5, 'GARAGE', 'Гараж с мастерской', 'Идеально для авторемонтных работ', ST_GeomFromText('POINT(37.6100 55.7200)', 4326), 'Москва, р-н Нагатино', 30.0, '["https://modul-ug.ru/upload/media/content/muzhskoe-delo-garazh-i-masterskaja.jpg"]', ARRAY['SECURITY', 'ELECTRICITY', 'WATER_SUPPLY']::space_amenity[], ARRAY['[2026-01-25, 2026-04-05)', '[2026-05-20, 2026-07-30)']::tstzrange[], 'ACTIVE', 94, 6, 11, NOW() - INTERVAL '16 days', NOW()),
(5, 'PARKING', 'Ночная парковка', 'Специальное предложение для ночной аренды', ST_GeomFromText('POINT(37.6200 55.7100)', 4326), 'Москва, р-н Донской', 11.0, '["https://i.pinimg.com/736x/c9/22/2b/c9222b63d6c8696105a37504ac163b2c.jpg"]', NULL, ARRAY['[2025-11-25, 2026-01-30)', '[2026-03-15, 2026-05-25)']::tstzrange[], 'INACTIVE', 41, 2, 6, NOW() - INTERVAL '9 days', NOW()),
(5, 'STORAGE', 'Архивное хранение', 'Для документов и архивных материалов', ST_GeomFromText('POINT(37.6300 55.7000)', 4326), 'Москва, бизнес-центр Север', 12.0, '["https://minisklad.storage.yandexcloud.net/store/infopage/39/headline_image/b17d3b82aba26c72e244102c622c68b9.jpg"]', ARRAY['SECURITY', 'VIDEO_SURVEILLANCE', 'ELECTRICITY']::space_amenity[], ARRAY['[2025-01-01, 2025-03-01)', '[2025-04-01, 2025-06-01)']::tstzrange[], 'PENDING_APPROVAL', 19, 1, 3, NOW() - INTERVAL '3 days', NOW());



-- LISTING_PRICINGS
INSERT INTO listing_pricings (listing_id, price, price_period) VALUES
-- Объявления пользователя 1
(1, 150.00, 'HOUR'), (1, 1500.00, 'DAY'), (1, 8000.00, 'WEEK'), (1, 25000.00, 'MONTH'),
(2, 100.00, 'HOUR'), (2, 500.00, 'DAY'), (2, 2500.00, 'WEEK'), (2, 8000.00, 'MONTH'),
(3, 100.00, 'DAY'), (3, 500.00, 'WEEK'), (3, 1800.00, 'MONTH'),
(4, 180.00, 'HOUR'), (4, 1800.00, 'DAY'), (4, 9000.00, 'WEEK'), (4, 28000.00, 'MONTH'),
(5, 140.00, 'HOUR'), (5, 400.00, 'DAY'), (5, 2000.00, 'WEEK'), (5, 7000.00, 'MONTH'),
(6, 1000.00, 'DAY'), (6, 6000.00, 'WEEK'), (6, 20000.00, 'MONTH'),
(7, 800.00, 'DAY'), (7, 4000.00, 'WEEK'), (7, 12000.00, 'MONTH'),
(8, 150.00, 'HOUR'), (8, 750.00, 'DAY'), (8, 3500.00, 'WEEK'), (8, 12000.00, 'MONTH'),
(9, 150.00, 'DAY'), (9, 700.00, 'WEEK'), (9, 2000.00, 'MONTH'),
(10, 250.00, 'HOUR'), (10, 2200.00, 'DAY'), (10, 11000.00, 'WEEK'), (10, 35000.00, 'MONTH'),
(11, 80.00, 'HOUR'), (11, 400.00, 'DAY'), (11, 2000.00, 'WEEK'), (11, 7000.00, 'MONTH'),
(12, 2000.00, 'DAY'), (12, 12000.00, 'WEEK'), (12, 45000.00, 'MONTH'),
(13, 100.00, 'HOUR'), (13, 1000.00, 'DAY'), (13, 5000.00, 'WEEK'), (13, 15000.00, 'MONTH'),

-- Объявления пользователя 2
(14, 80.00, 'HOUR'), (14, 800.00, 'DAY'), (14, 4000.00, 'WEEK'), (14, 14000.00, 'MONTH'),
(15, 50.00, 'HOUR'), (15, 200.00, 'DAY'), (15, 1000.00, 'WEEK'), (15, 3500.00, 'MONTH'),

-- Объявления пользователя 3
(16, 600.00, 'WEEK'), (16, 2000.00, 'MONTH'),
(17, 2500.00, 'DAY'), (17, 15000.00, 'WEEK'), (17, 45000.00, 'MONTH'),
(18, 140.00, 'HOUR'), (18, 400.00, 'DAY'), (18, 2000.00, 'WEEK'),
(19, 1000.00, 'WEEK'), (19, 5000.00, 'MONTH'),

-- Объявления пользователя 4
(20, 160.00, 'HOUR'), (20, 600.00, 'DAY'), (20, 3000.00, 'WEEK'), (20, 10000.00, 'MONTH'),

-- Объявления пользователя 5
(21, 100.00, 'HOUR'), (21, 1000.00, 'DAY'), (21, 5000.00, 'WEEK'), (21, 18000.00, 'MONTH'),
(22, 1000.00, 'WEEK'), (22, 3500.00, 'MONTH'),
(23, 180.00, 'HOUR'), (23, 1800.00, 'DAY'), (23, 9000.00, 'WEEK'),
(24, 150.00, 'HOUR'), (24, 1000.00, 'DAY'),
(25, 250.00, 'WEEK'), (25, 800.00, 'MONTH');



-- BOOKINGS
INSERT INTO bookings (listing_id, renter_id, period, total_price, price, price_period, status, created_at, updated_at) VALUES
(14, 1, '[2026-02-10, 2026-02-15)'::tstzrange, 9000.00, 1800.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
(14, 1, '[2026-03-01, 2026-03-05)'::tstzrange, 7200.00, 1800.00, 'DAY', 'CONFIRMED', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
(18, 1, '[2026-02-20, 2026-02-25)'::tstzrange, 4000.00, 800.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
(18, 1, '[2026-04-10, 2026-04-15)'::tstzrange, 4000.00, 800.00, 'DAY', 'CANCELLED', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

(1, 2, '[2026-01-15, 2026-01-20)'::tstzrange, 7500.00, 1500.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
(1, 2, '[2026-02-20, 2026-02-25)'::tstzrange, 7500.00, 1500.00, 'DAY', 'CONFIRMED', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

(11, 3, '[2026-02-01, 2026-03-01)'::tstzrange, 7000.00, 7000.00, 'MONTH', 'COMPLETED', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),
(11, 3, '[2026-06-01, 2026-07-01)'::tstzrange, 7000.00, 7000.00, 'MONTH', 'CONFIRMED', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(10, 3, '[2026-01-10, 2026-02-10)'::tstzrange, 31000.00, 1000.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
(10, 3, '[2026-04-01, 2026-05-01)'::tstzrange, 30000.00, 1000.00, 'DAY', 'CONFIRMED', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
(14, 3, '[2026-01-20, 2026-01-25)'::tstzrange, 4000.00, 800.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(14, 3, '[2026-02-20, 2026-02-25)'::tstzrange, 4000.00, 800.00, 'DAY', 'CANCELLED', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),

(12, 5, '[2026-01-20, 2026-02-20)'::tstzrange, 2000.00, 2000.00, 'MONTH', 'COMPLETED', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

(20, 2, '[2026-01-01, 2026-01-08)'::tstzrange, 3000.00, 3000.00, 'WEEK', 'COMPLETED', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
(21, 2, '[2026-01-10, 2026-01-12)'::tstzrange, 2000.00, 1000.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),

(15, 3, '[2026-02-01, 2026-03-01)'::tstzrange, 3500.00, 3500.00, 'MONTH', 'COMPLETED', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),

(2, 4, '[2026-02-10, 2026-02-17)'::tstzrange, 2500.00, 2500.00, 'WEEK', 'COMPLETED', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
(16, 4, '[2026-03-01, 2026-04-01)'::tstzrange, 2000.00, 2000.00, 'MONTH', 'CONFIRMED', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(23, 4, '[2026-01-15, 2026-01-18)'::tstzrange, 5400.00, 1800.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days'),

(14, 5, '[2026-01-20, 2026-02-03)'::tstzrange, 8000.00, 4000.00, 'WEEK', 'COMPLETED', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
(20, 5, '[2026-02-01, 2026-02-06)'::tstzrange, 3000.00, 600.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days');

-- НОВЫЕ БРОНИРОВАНИЯ
INSERT INTO bookings (listing_id, renter_id, period, total_price, price, price_period, status, created_at, updated_at) VALUES
-- Бронирования пользователя 1 (как арендатора)
(14, 1, '[2026-03-10, 2026-03-12)'::tstzrange, 160.00, 80.00, 'HOUR', 'COMPLETED', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
(15, 1, '[2026-04-01, 2026-04-05)'::tstzrange, 800.00, 200.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
(18, 1, '[2026-05-01, 2026-05-05)'::tstzrange, 1600.00, 400.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
(21, 1, '[2026-05-10, 2026-05-12)'::tstzrange, 2000.00, 1000.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
(20, 1, '[2026-06-01, 2026-06-05)'::tstzrange, 2400.00, 600.00, 'DAY', 'CONFIRMED', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(23, 1, '[2026-05-01, 2026-05-03)'::tstzrange, 360.00, 180.00, 'HOUR', 'COMPLETED', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
(14, 1, '[2026-05-20, 2026-05-22)'::tstzrange, 160.00, 80.00, 'HOUR', 'COMPLETED', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

-- Бронирования пользователя 2 (как арендатора)
(23, 2, '[2026-04-25, 2026-04-30)'::tstzrange, 9000.00, 1800.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),
(2, 2, '[2026-05-20, 2026-05-25)'::tstzrange, 2500.00, 500.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(18, 2, '[2026-05-15, 2026-05-18)'::tstzrange, 1200.00, 400.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(4, 2, '[2026-06-25, 2026-07-05)'::tstzrange, 18000.00, 1800.00, 'DAY', 'CONFIRMED', NOW(), NOW()), -- Текущая активная бронь

-- Бронирования пользователя 3 (как арендатора)
(1, 3, '[2026-03-15, 2026-03-17)'::tstzrange, 3000.00, 1500.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
(4, 3, '[2026-04-10, 2026-04-12)'::tstzrange, 3600.00, 1800.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
(18, 3, '[2026-05-12, 2026-05-15)'::tstzrange, 1200.00, 400.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
(20, 3, '[2026-05-22, 2026-05-25)'::tstzrange, 1800.00, 600.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
(5, 3, '[2026-07-01, 2026-07-10)'::tstzrange, 3600.00, 400.00, 'DAY', 'PENDING', NOW(), NOW()), -- Будущая бронь на рассмотрении

-- Бронирования пользователя 4 (как арендатора)
(14, 4, '[2026-03-20, 2026-03-22)'::tstzrange, 160.00, 80.00, 'HOUR', 'COMPLETED', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
(15, 4, '[2026-04-15, 2026-04-17)'::tstzrange, 400.00, 200.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
(18, 4, '[2026-05-05, 2026-05-10)'::tstzrange, 2000.00, 400.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
(11, 4, '[2026-05-25, 2026-05-28)'::tstzrange, 1200.00, 400.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(13, 4, '[2026-06-01, 2026-06-03)'::tstzrange, 2000.00, 1000.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
(7, 4, '[2026-06-20, 2026-06-30)'::tstzrange, 8000.00, 800.00, 'DAY', 'CONFIRMED', NOW(), NOW()), -- Текущая активная бронь

-- Бронирования пользователя 5 (как арендатора)
(1, 5, '[2026-04-20, 2026-04-25)'::tstzrange, 7500.00, 1500.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
(20, 5, '[2026-05-15, 2026-05-20)'::tstzrange, 3000.00, 600.00, 'DAY', 'COMPLETED', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days');



-- REVIEWS
INSERT INTO reviews (booking_id, reviewer_id, rating, text, created_at) VALUES
-- Старые отзывы (на арендодателя 1)
(1, 1, 5, 'Отличный гараж, все чисто и аккуратно. Хозяин приятный в общении, помог с заселением. Рекомендую!', NOW() - INTERVAL '18 days'),
(3, 1, 5, 'Отличная парковка у метро! Очень удобное расположение, всегда есть свободные места. 5 звезд!', NOW() - INTERVAL '12 days'),
(5, 2, 4, 'Гараж теплый, как и обещали. Небольшие проблемы с замком, но быстро починили. В целом доволен.', NOW() - INTERVAL '22 days'),
(9, 3, 4, 'Гараж с мастерской - то что нужно! Все инструменты в наличии, электричество стабильное. Спасибо!', NOW() - INTERVAL '8 days'),
(13, 5, 5, 'Термосклад идеален для хранения продуктов! Температура поддерживается точно. Профессионально!', NOW() - INTERVAL '4 days'),
-- Новые отзывы (на остальных арендодателей)
(16, 3, 5, 'Отличная уличная парковка, чисто и безопасно.', NOW() - INTERVAL '14 days'), -- на пользователя 2
(20, 5, 4, 'Хороший гараж, но дверь туго открывается.', NOW() - INTERVAL '20 days'), -- на пользователя 2
(18, 4, 5, 'Отличный склад, все вещи в сохранности, сухо.', NOW() - INTERVAL '4 days'), -- на пользователя 3
(14, 2, 4, 'Бюджетный вариант, полностью оправдывает свою цену.', NOW() - INTERVAL '28 days'), -- на пользователя 4
(21, 5, 5, 'Нормальный гараж, хозяин адекватный и пунктуальный.', NOW() - INTERVAL '8 days'), -- на пользователя 4
(15, 2, 5, 'Шикарное место, очень удобно парковаться на внедорожнике.', NOW() - INTERVAL '24 days'); -- на пользователя 5

-- НОВЫЕ ОТЗЫВЫ
-- 1. ОТЗЫВЫ НА АРЕНДОДАТЕЛЕЙ (ОТ ЛИЦА АРЕНДАТОРОВ)
INSERT INTO reviews (booking_id, reviewer_id, rating, text, created_at) VALUES
-- На арендодателя 1 (пользователь 1)
(7, 3, 5, 'Всё прошло замечательно, парковка чистая и просторная.', NOW() - INTERVAL '3 days'),
(17, 4, 5, 'Удобный гараж, никаких проблем с доступом.', NOW() - INTERVAL '3 days'),

-- На арендодателя 2 (пользователь 2)
(11, 3, 5, 'Отличное место, владелец всегда на связи и готов помочь.', NOW() - INTERVAL '3 days'),
(22, 1, 5, 'Чистый гараж, заезд без проблем, рекомендую.', NOW() - INTERVAL '3 days'),
(30, 4, 4, 'Хороший сухой гараж, немного узкие ворота.', NOW() - INTERVAL '3 days'),
(31, 4, 5, 'Удобная парковка во дворе, место закреплено.', NOW() - INTERVAL '3 days'),

-- На арендодателя 3 (пользователь 3)
(24, 1, 3, 'Далековато от метро, но в целом нормально за свои деньги.', NOW() - INTERVAL '3 days'),
(32, 4, 3, 'Всё как в описании, но были задержки при передаче ключей.', NOW() - INTERVAL '3 days'),
(41, 3, 4, 'Удобная парковка, чисто.', NOW() - INTERVAL '3 days'),
(42, 2, 4, 'Всё хорошо, спасибо.', NOW() - INTERVAL '3 days'),

-- На арендодателя 4 (пользователь 4)
(34, 5, 5, 'Бюджетно и надежно, рекомендую!', NOW() - INTERVAL '3 days'),
(43, 3, 5, 'Приятный арендодатель, всё соответствует ожиданиям.', NOW() - INTERVAL '3 days'),

-- На арендодателя 5 (пользователь 5)
(25, 1, 4, 'Охрана работает отлично, но заезд узковат.', NOW() - INTERVAL '3 days'),
(29, 3, 4, 'Хорошая мастерская, тепло и просторно.', NOW() - INTERVAL '3 days');

-- 2. ОТЗЫВЫ НА АРЕНДАТОРОВ (ОТ ЛИЦА ВЛАДЕЛЬЦЕВ ОБЪЯВЛЕНИЙ)
INSERT INTO reviews (booking_id, reviewer_id, rating, text, created_at) VALUES
-- На арендатора 1 (пользователь 1, цель: 8 отзывов, рейтинг ~4.5)
(1, 2, 5, 'Замечательный арендатор. Оставил гараж в полной чистоте.', NOW() - INTERVAL '17 days'),
(3, 3, 4, 'Всё прошло хорошо, но немного задержал сдачу ключей.', NOW() - INTERVAL '11 days'),
(22, 2, 4, 'Пунктуальный и вежливый арендатор. Рекомендую.', NOW() - INTERVAL '14 days'),
(23, 2, 5, 'Идеальный порядок, никаких претензий.', NOW() - INTERVAL '11 days'),
(24, 3, 5, 'Приятный в общении человек, всё вовремя.', NOW() - INTERVAL '9 days'),
(25, 5, 4, 'Всё в порядке, рекомендую к сотрудничеству.', NOW() - INTERVAL '7 days'),
(29, 5, 4, 'Аренда прошла успешно, вежливое общение.', NOW() - INTERVAL '6 days'),
(27, 1, 5, 'Замечательный гость, всегда рады видеть снова.', NOW() - INTERVAL '4 days'),

-- На арендатора 2 (пользователь 2, цель: 5 отзывов, рейтинг ~4.2)
(5, 1, 4, 'Хороший арендатор, но немного опоздал на встречу.', NOW() - INTERVAL '15 days'),
(14, 4, 4, 'Оплата вовремя, гараж сдан в чистом виде.', NOW() - INTERVAL '12 days'),
(15, 5, 5, 'Отличный клиент, вежливый и аккуратный.', NOW() - INTERVAL '10 days'),
(35, 5, 4, 'Всё прошло хорошо, без нареканий.', NOW() - INTERVAL '8 days'),
(36, 1, 4, 'Нормальный арендатор, правила пользования не нарушал.', NOW() - INTERVAL '4 days'),

-- На арендатора 3 (пользователь 3, цель: 5 отзывов, рейтинг ~4.8)
(7, 1, 5, 'Прекрасный арендатор, чистоплотный и пунктуальный.', NOW() - INTERVAL '13 days'),
(9, 1, 5, 'Очень бережное отношение к чужому имуществу.', NOW() - INTERVAL '11 days'),
(11, 2, 5, 'Коммуникация на высоте, рекомендую!', NOW() - INTERVAL '9 days'),
(28, 1, 4, 'Всё отлично, никаких проблем в процессе.', NOW() - INTERVAL '7 days'),
(43, 4, 5, 'Отличный опыт аренды, вежливый и честный человек.', NOW() - INTERVAL '3 days'),

-- На арендатора 4 (пользователь 4, цель: 7 отзывов, рейтинг ~4.0)
(17, 1, 4, 'Всё прошло нормально, аренду оплатил вовремя.', NOW() - INTERVAL '11 days'),
(19, 5, 4, 'Адекватный клиент, рекомендую.', NOW() - INTERVAL '10 days'),
(30, 2, 4, 'Никаких проблем, вежливый человек.', NOW() - INTERVAL '9 days'),
(31, 2, 4, 'Спокойный арендатор, оставил место чистым.', NOW() - INTERVAL '8 days'),
(32, 3, 4, 'Всё в порядке, соблюдал все договоренности.', NOW() - INTERVAL '7 days'),
(39, 1, 4, 'Прошло без эксцессов, спасибо за аренду.', NOW() - INTERVAL '4 days'),
(40, 1, 4, 'Стандартный арендатор, всё вовремя.', NOW() - INTERVAL '3 days'),

-- На арендатора 5 (пользователь 5, цель: 5 отзывов, рейтинг ~4.6)
(13, 1, 5, 'Отличный арендатор, рекомендую всем арендодателям.', NOW() - INTERVAL '8 days'),
(20, 2, 5, 'Всё супер, очень аккуратный и ответственный.', NOW() - INTERVAL '7 days'),
(21, 4, 4, 'Проблем не возникло, оплата своевременная.', NOW() - INTERVAL '6 days'),
(33, 1, 5, 'Чистота и порядок после завершения аренды.', NOW() - INTERVAL '5 days'),
(34, 4, 4, 'Всё по договору, вежливое общение.', NOW() - INTERVAL '4 days');



-- WALLETS
INSERT INTO wallets (user_id, balance) VALUES
(1, 15000.50),
(2, 8000.00),
(3, 25000.00),
(4, 3000.00),
(5, 50000.00);



-- SUBSCRIPTION_PLANS
INSERT INTO subscription_plans (name, status, price, max_listings, priority_search, boosts_per_month, description, extra_features) VALUES
('Start', 'ACTIVE', 0.00, 3, false, 1, 'Базовый тариф для тех, кто сдает одно-два места', '{"support_level": "basic"}'),
('Standard', 'ACTIVE', 490.00, 10, true, 5, 'Для активных арендодателей. Включает приоритет в поиске.', '{"support_level": "priority"}'),
('Premium', 'ACTIVE', 1490.00, 30, true, 15, 'Расширенная аналитика и премиум-размещение для инвесторов.', '{"support_level": "premium", "advanced_analytics": true}'),
('Enterprise', 'ACTIVE', 4990.00, 100, true, 50, 'Для коммерческих сетей паркингов и складов.', '{"support_level": "personal_manager", "api_access": true}');



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
INSERT INTO transactions (user_id, type, status, amount, booking_id, description, gateway_transaction_id, created_at) VALUES
-- Транзакции пользователя 1
(1, 'DEPOSIT', 'SUCCESS', 20000.00, NULL, 'Пополнение с банковской карты', 'card_txn_001', NOW() - INTERVAL '35 days'),
(1, 'WITHDRAWAL', 'SUCCESS', 500.00, NULL, 'Оплата подписки Standard', 'sub_txn_001', NOW() - INTERVAL '30 days'),
(1, 'BOOKING_PAYMENT', 'SUCCESS', 9000.00, 1, 'Оплата бронирования #1', 'book_txn_001', NOW() - INTERVAL '20 days'),
(1, 'COMMISSION', 'SUCCESS', 900.00, 1, 'Комиссия платформы за бронирование #1', 'comm_txn_001', NOW() - INTERVAL '20 days'),

-- Транзакции пользователя 2
(2, 'DEPOSIT', 'SUCCESS', 15000.00, NULL, 'Пополнение через СБП', 'sbp_txn_001', NOW() - INTERVAL '65 days'),
(2, 'WITHDRAWAL', 'SUCCESS', 490.00, NULL, 'Оплата подписки Standard', 'sub_txn_002', NOW() - INTERVAL '60 days'),
(2, 'BOOKING_PAYMENT', 'SUCCESS', 7500.00, 5, 'Оплата бронирования #5', 'book_txn_002', NOW() - INTERVAL '18 days'),
(2, 'BOOKING_PAYMENT', 'SUCCESS', 3000.00, 14, 'Оплата бронирования #14', 'book_txn_003', NOW() - INTERVAL '30 days'),
(2, 'BOOKING_PAYMENT', 'SUCCESS', 2000.00, 15, 'Оплата бронирования #15', 'book_txn_004', NOW() - INTERVAL '25 days'),

-- Транзакции пользователя 3
(3, 'DEPOSIT', 'SUCCESS', 30000.00, NULL, 'Пополнение счета', 'card_txn_002', NOW() - INTERVAL '20 days'),
(3, 'WITHDRAWAL', 'SUCCESS', 1490.00, NULL, 'Оплата подписки Premium', 'sub_txn_003', NOW() - INTERVAL '15 days'),
(3, 'BOOKING_PAYMENT', 'SUCCESS', 7000.00, 7, 'Оплата бронирования #7', 'book_txn_005', NOW() - INTERVAL '16 days'),
(3, 'BOOKING_PAYMENT', 'SUCCESS', 3500.00, 16, 'Оплата бронирования #16', 'book_txn_006', NOW() - INTERVAL '15 days'),

-- Транзакции пользователя 4 (Расширено)
(4, 'DEPOSIT', 'SUCCESS', 5000.00, NULL, 'Пополнение счета (карта)', 'card_txn_003', NOW() - INTERVAL '35 days'),
(4, 'DEPOSIT', 'SUCCESS', 15000.00, NULL, 'Пополнение через СБП', 'sbp_txn_002', NOW() - INTERVAL '30 days'),
(4, 'BOOKING_PAYMENT', 'SUCCESS', 5400.00, 19, 'Оплата бронирования #19', 'book_txn_007', NOW() - INTERVAL '28 days'),
(4, 'COMMISSION', 'SUCCESS', 540.00, 19, 'Комиссия за бронирование #19', 'comm_txn_004', NOW() - INTERVAL '28 days'),
(4, 'BOOKING_PAYMENT', 'SUCCESS', 2500.00, 17, 'Оплата бронирования #17', 'book_txn_008', NOW() - INTERVAL '12 days'),
(4, 'COMMISSION', 'SUCCESS', 250.00, 17, 'Комиссия за бронирование #17', 'comm_txn_005', NOW() - INTERVAL '12 days'),
(4, 'BOOKING_PAYMENT', 'SUCCESS', 2000.00, 18, 'Оплата бронирования #18', 'book_txn_009', NOW() - INTERVAL '5 days'),
(4, 'COMMISSION', 'SUCCESS', 200.00, 18, 'Комиссия за бронирование #18', 'comm_txn_006', NOW() - INTERVAL '5 days'),

-- Транзакции пользователя 5
(5, 'DEPOSIT', 'SUCCESS', 60000.00, NULL, 'Пополнение бизнес-счета', 'card_txn_004', NOW() - INTERVAL '30 days'),
(5, 'WITHDRAWAL', 'SUCCESS', 4990.00, NULL, 'Оплата Enterprise подписки', 'sub_txn_005', NOW() - INTERVAL '7 days'),
(5, 'BOOKING_PAYMENT', 'SUCCESS', 8000.00, 20, 'Оплата бронирования #20', 'book_txn_010', NOW() - INTERVAL '22 days'),
(5, 'BOOKING_PAYMENT', 'SUCCESS', 3000.00, 21, 'Оплата бронирования #21', 'book_txn_011', NOW() - INTERVAL '10 days'),
(5, 'WITHDRAWAL', 'SUCCESS', 10000.00, NULL, 'Вывод дохода', 'payout_txn_002', NOW() - INTERVAL '5 days');



-- CONVERSATIONS
INSERT INTO conversations (participant1_id, participant2_id, listing_id, last_message_at, created_at, updated_at) VALUES
-- Чат между пользователем 1 и пользователем 2 по бронированию гаража
(1, 2, 14, NOW() - INTERVAL '18 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days'),
-- Чат между пользователем 1 и пользователем 3 по парковке у метро
(1, 3, 18, NOW() - INTERVAL '10 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days'),
-- Чат между пользователем 2 и пользователем 5 по термоскладу
(2, 5, 22, NOW() - INTERVAL '3 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '3 days'),
-- Чат между пользователем 3 и пользователем 5 по VIP парковке
(3, 5, 21, NOW() - INTERVAL '8 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '8 days'),
-- Чат между пользователем 4 и пользователем 5 по гаражу с мастерской
(4, 5, 23, NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days'),
-- Чат между пользователем 1 и пользователем 5 (общий, без привязки к объявлению)
(1, 5, NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 days'),
-- НОВЫЕ ДИАЛОГИ
(1, 3, 11, NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
(1, 4, 20, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
(2, 3, 14, NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
(2, 4, 15, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
(3, 4, 18, NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
(4, 5, 21, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '1 day', NOW() - INTERVAL '12 hours');



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
(6, 1, 'Понял, спасибо!', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 days', NOW() - INTERVAL '2 days'),

-- НОВЫЕ СООБЩЕНИЯ

-- Чат 7 (пользователи 1 и 3, по гостевому паркингу №11)
(7, 3, 'Привет! Можно арендовать гостевое место на этой неделе?', true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(7, 1, 'Привет! Да, конечно. На какие дни планируешь?', true, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days'),
(7, 3, 'С четверга по субботу. Оформляю бронь.', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

-- Чат 8 (пользователи 1 и 4, по эконом гаражу №20)
(8, 4, 'Здравствуйте. Подскажите, ворота в гараж легко открываются зимой?', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(8, 1, 'Здравствуйте! Да, петли регулярно смазываю, проблем не будет.', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(8, 4, 'Супер, спасибо за ответ!', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 days', NOW() - INTERVAL '2 days'),

-- Чат 9 (пользователи 2 и 3, по гаражу №14)
(9, 3, 'Добрый день! Интересует гараж в Митино. Какая высота потолка?', true, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
(9, 2, 'Здравствуйте. Высота около 2.2 метров, внедорожник проходит свободно.', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(9, 3, 'Отлично, мне как раз для кроссовера.', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

-- Чат 10 (пользователи 2 и 4, по уличной парковке №15)
(10, 4, 'Привет. Место на парковке закреплено или общего пользования во дворе?', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(10, 2, 'Привет! Место закреплено, установлен индивидуальный барьер.', true, NOW() - INTERVAL '2 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(10, 4, 'Понял, это очень удобно.', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

-- Чат 11 (пользователи 3 и 4, по парковке у метро №18)
(11, 4, 'Здравствуйте! Как там с охраной на этой парковке?', true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(11, 3, 'Здравствуйте! Въезд по пропускам, камера смотрит прямо на машиноместо.', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
(11, 4, 'Хорошо, забронировал.', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

-- Чат 12 (пользователи 4 и 5, по VIP парковке №21)
(12, 4, 'Добрый вечер. Нужен ли пропуск для въезда гостей?', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
(12, 5, 'Добрый! Да, нужно будет написать мне номер машины заранее, я закажу разовый пропуск.', true, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'),
(12, 4, 'Понял вас, спасибо.', true, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '6 hours');
