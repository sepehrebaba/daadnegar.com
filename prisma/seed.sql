-- =============================================================================
-- Daadnegar SQL Seed (mirrors prisma/seed.ts)
-- Run: mysql -u USER -p DATABASE < prisma/seed.sql
-- Or: mysql -h HOST -u USER -p DATABASE < prisma/seed.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Invite Codes (base 3 from seed.ts + extras)
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO invite_code (id, code, isActive, usedById, inviterId, createdAt) VALUES
('ic_invite2024', 'INVITE2024', 1, NULL, NULL, NOW()),
('ic_test123', 'TEST123', 1, NULL, NULL, NOW()),
('ic_demo456', 'DEMO456', 1, NULL, NULL, NOW()),
('ic_dev001', 'DEV001', 1, NULL, NULL, NOW()),
('ic_dev002', 'DEV002', 1, NULL, NULL, NOW()),
('ic_dev003', 'DEV003', 1, NULL, NULL, NOW()),
('ic_beta2024', 'BETA2024', 1, NULL, NULL, NOW()),
('ic_alpha2024', 'ALPHA2024', 1, NULL, NULL, NOW()),
('ic_staging1', 'STAGING1', 1, NULL, NULL, NOW()),
('ic_staging2', 'STAGING2', 1, NULL, NULL, NOW()),
('ic_prod001', 'PROD001', 1, NULL, NULL, NOW()),
('ic_prod002', 'PROD002', 1, NULL, NULL, NOW()),
('ic_team01', 'TEAM01', 1, NULL, NULL, NOW()),
('ic_team02', 'TEAM02', 1, NULL, NULL, NOW()),
('ic_team03', 'TEAM03', 1, NULL, NULL, NOW()),
('ic_partner1', 'PARTNER1', 1, NULL, NULL, NOW()),
('ic_partner2', 'PARTNER2', 1, NULL, NULL, NOW()),
('ic_vip001', 'VIP001', 1, NULL, NULL, NOW()),
('ic_vip002', 'VIP002', 1, NULL, NULL, NOW()),
('ic_welcome1', 'WELCOME1', 1, NULL, NULL, NOW()),
('ic_welcome2', 'WELCOME2', 1, NULL, NULL, NOW());

-- -----------------------------------------------------------------------------
-- 2. Settings
-- -----------------------------------------------------------------------------
INSERT INTO setting (id, `key`, value, updatedAt) VALUES
(UUID(), 'reports_enabled', 'true', NOW()),
(UUID(), 'default_tokens_new_user', '10', NOW()),
(UUID(), 'tokens_reward_approved_report', '5', NOW()),
(UUID(), 'tokens_deduct_false_report', '3', NOW()),
(UUID(), 'tokens_deduct_problematic_report', '1', NOW()),
(UUID(), 'tokens_reward_invited_activity', '2', NOW()),
(UUID(), 'max_invite_codes_unused', '5', NOW())
ON DUPLICATE KEY UPDATE value = VALUES(value), updatedAt = NOW();

-- -----------------------------------------------------------------------------
-- 3. Categories (report categories + subcategories)
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO category (id, name, slug, type, sortOrder, isActive, parentId, createdAt, updatedAt) VALUES
-- Parents
('cat_bribery', 'رشوه', 'bribery', 'report', 0, 1, NULL, NOW(), NOW()),
('cat_embezzlement', 'اختلاس', 'embezzlement', 'report', 1, 1, NULL, NOW(), NOW()),
('cat_nepotism', 'پارتی‌بازی و رانت', 'nepotism', 'report', 2, 1, NULL, NOW(), NOW()),
('cat_abuse', 'سوءاستفاده از قدرت', 'abuse', 'report', 3, 1, NULL, NOW(), NOW()),
('cat_other', 'سایر', 'other', 'report', 4, 1, NULL, NOW(), NOW());
-- Subcategories
INSERT IGNORE INTO category (id, name, slug, type, sortOrder, isActive, parentId, createdAt, updatedAt) VALUES
('cat_bribery_cash', 'نقدی', 'cash', 'report', 0, 1, 'cat_bribery', NOW(), NOW()),
('cat_bribery_gift', 'هدیه/خدمات', 'gift', 'report', 1, 1, 'cat_bribery', NOW(), NOW()),
('cat_bribery_promise', 'وعده منصب/امتیاز', 'promise', 'report', 2, 1, 'cat_bribery', NOW(), NOW()),
('cat_embezzlement_budget', 'بودجه دولتی', 'budget', 'report', 0, 1, 'cat_embezzlement', NOW(), NOW()),
('cat_embezzlement_public', 'اموال عمومی', 'public', 'report', 1, 1, 'cat_embezzlement', NOW(), NOW()),
('cat_nepotism_hiring', 'استخدام غیرعادلانه', 'hiring', 'report', 0, 1, 'cat_nepotism', NOW(), NOW()),
('cat_nepotism_contract', 'واگذاری قرارداد', 'contract', 'report', 1, 1, 'cat_nepotism', NOW(), NOW()),
('cat_abuse_position', 'سوءاستفاده از موقعیت', 'position', 'report', 0, 1, 'cat_abuse', NOW(), NOW()),
('cat_abuse_threat', 'تهدید و ارعاب', 'threat', 'report', 1, 1, 'cat_abuse', NOW(), NOW()),
('cat_other_other', 'موارد دیگر', 'other', 'report', 0, 1, 'cat_other', NOW(), NOW());

-- -----------------------------------------------------------------------------
-- 4. Provinces and Cities
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO province (id, name, sortOrder, createdAt) VALUES
('prov_tehran', 'تهران', 0, NOW()),
('prov_isfahan', 'اصفهان', 1, NOW()),
('prov_fars', 'فارس', 2, NOW()),
('prov_khorasan_razavi', 'خراسان رضوی', 3, NOW()),
('prov_khuzestan', 'خوزستان', 4, NOW()),
('prov_azerbaijan_sharghi', 'آذربایجان شرقی', 5, NOW()),
('prov_azerbaijan_gharbi', 'آذربایجان غربی', 6, NOW()),
('prov_mazandaran', 'مازندران', 7, NOW()),
('prov_gilan', 'گیلان', 8, NOW()),
('prov_alborz', 'البرز', 9, NOW()),
('prov_qom', 'قم', 10, NOW()),
('prov_markazi', 'مرکزی', 11, NOW()),
('prov_yazd', 'یزد', 12, NOW()),
('prov_kerman', 'کرمان', 13, NOW()),
('prov_hamadan', 'همدان', 14, NOW()),
('prov_kordestan', 'کردستان', 15, NOW()),
('prov_zanjan', 'زنجان', 16, NOW()),
('prov_lorestan', 'لرستان', 17, NOW()),
('prov_qazvin', 'قزوین', 18, NOW()),
('prov_ardabil', 'اردبیل', 19, NOW()),
('prov_bushehr', 'بوشهر', 20, NOW()),
('prov_semnan', 'سمنان', 21, NOW()),
('prov_golestan', 'گلستان', 22, NOW()),
('prov_sistan', 'سیستان و بلوچستان', 23, NOW()),
('prov_kermanshah', 'کرمانشاه', 24, NOW()),
('prov_hormozgan', 'هرمزگان', 25, NOW()),
('prov_ilam', 'ایلام', 26, NOW()),
('prov_chaharmahal', 'چهارمحال و بختیاری', 27, NOW()),
('prov_khorasan_jonoobi', 'خراسان جنوبی', 28, NOW()),
('prov_khorasan_shomali', 'خراسان شمالی', 29, NOW()),
('prov_kohgiluyeh', 'کهگیلویه و بویراحمد', 30, NOW());

INSERT IGNORE INTO city (id, name, provinceId, sortOrder, createdAt) VALUES
('city_t1', 'تهران', 'prov_tehran', 0, NOW()),
('city_t2', 'اسلامشهر', 'prov_tehran', 1, NOW()),
('city_t3', 'پاکدشت', 'prov_tehran', 2, NOW()),
('city_t4', 'شهریار', 'prov_tehran', 3, NOW()),
('city_t5', 'ورامین', 'prov_tehran', 4, NOW()),
('city_t6', 'رباط‌کریم', 'prov_tehran', 5, NOW()),
('city_i1', 'اصفهان', 'prov_isfahan', 0, NOW()),
('city_i2', 'کاشان', 'prov_isfahan', 1, NOW()),
('city_i3', 'نجف‌آباد', 'prov_isfahan', 2, NOW()),
('city_i4', 'خمینی‌شهر', 'prov_isfahan', 3, NOW()),
('city_i5', 'شاهین‌شهر', 'prov_isfahan', 4, NOW()),
('city_f1', 'شیراز', 'prov_fars', 0, NOW()),
('city_f2', 'مرودشت', 'prov_fars', 1, NOW()),
('city_f3', 'جهرم', 'prov_fars', 2, NOW()),
('city_f4', 'کازرون', 'prov_fars', 3, NOW()),
('city_f5', 'آباده', 'prov_fars', 4, NOW()),
('city_kr1', 'مشهد', 'prov_khorasan_razavi', 0, NOW()),
('city_kr2', 'نیشابور', 'prov_khorasan_razavi', 1, NOW()),
('city_kr3', 'سبزوار', 'prov_khorasan_razavi', 2, NOW()),
('city_kr4', 'تربت حیدریه', 'prov_khorasan_razavi', 3, NOW()),
('city_kr5', 'قوچان', 'prov_khorasan_razavi', 4, NOW()),
('city_kz1', 'اهواز', 'prov_khuzestan', 0, NOW()),
('city_kz2', 'دزفول', 'prov_khuzestan', 1, NOW()),
('city_kz3', 'آبادان', 'prov_khuzestan', 2, NOW()),
('city_kz4', 'خرمشهر', 'prov_khuzestan', 3, NOW()),
('city_kz5', 'اندیمشک', 'prov_khuzestan', 4, NOW()),
('city_as1', 'تبریز', 'prov_azerbaijan_sharghi', 0, NOW()),
('city_as2', 'مراغه', 'prov_azerbaijan_sharghi', 1, NOW()),
('city_as3', 'مرند', 'prov_azerbaijan_sharghi', 2, NOW()),
('city_as4', 'میانه', 'prov_azerbaijan_sharghi', 3, NOW()),
('city_as5', 'بناب', 'prov_azerbaijan_sharghi', 4, NOW()),
('city_ag1', 'ارومیه', 'prov_azerbaijan_gharbi', 0, NOW()),
('city_ag2', 'خوی', 'prov_azerbaijan_gharbi', 1, NOW()),
('city_ag3', 'مهاباد', 'prov_azerbaijan_gharbi', 2, NOW()),
('city_ag4', 'سلماس', 'prov_azerbaijan_gharbi', 3, NOW()),
('city_ag5', 'بوکان', 'prov_azerbaijan_gharbi', 4, NOW()),
('city_m1', 'ساری', 'prov_mazandaran', 0, NOW()),
('city_m2', 'بابل', 'prov_mazandaran', 1, NOW()),
('city_m3', 'آمل', 'prov_mazandaran', 2, NOW()),
('city_m4', 'قائم‌شهر', 'prov_mazandaran', 3, NOW()),
('city_m5', 'تنکابن', 'prov_mazandaran', 4, NOW()),
('city_g1', 'رشت', 'prov_gilan', 0, NOW()),
('city_g2', 'انزلی', 'prov_gilan', 1, NOW()),
('city_g3', 'لاهیجان', 'prov_gilan', 2, NOW()),
('city_g4', 'لنگرود', 'prov_gilan', 3, NOW()),
('city_g5', 'رودسر', 'prov_gilan', 4, NOW()),
('city_a1', 'کرج', 'prov_alborz', 0, NOW()),
('city_a2', 'هشتگرد', 'prov_alborz', 1, NOW()),
('city_a3', 'نظرآباد', 'prov_alborz', 2, NOW()),
('city_a4', 'طالقان', 'prov_alborz', 3, NOW()),
('city_q1', 'قم', 'prov_qom', 0, NOW()),
('city_mk1', 'اراک', 'prov_markazi', 0, NOW()),
('city_mk2', 'ساوه', 'prov_markazi', 1, NOW()),
('city_mk3', 'خمین', 'prov_markazi', 2, NOW()),
('city_mk4', 'محلات', 'prov_markazi', 3, NOW()),
('city_mk5', 'دلیجان', 'prov_markazi', 4, NOW()),
('city_y1', 'یزد', 'prov_yazd', 0, NOW()),
('city_y2', 'مهریز', 'prov_yazd', 1, NOW()),
('city_y3', 'اردکان', 'prov_yazd', 2, NOW()),
('city_y4', 'میبد', 'prov_yazd', 3, NOW()),
('city_y5', 'بافق', 'prov_yazd', 4, NOW()),
('city_km1', 'کرمان', 'prov_kerman', 0, NOW()),
('city_km2', 'رفسنجان', 'prov_kerman', 1, NOW()),
('city_km3', 'سیرجان', 'prov_kerman', 2, NOW()),
('city_km4', 'بردسیر', 'prov_kerman', 3, NOW()),
('city_km5', 'جیرفت', 'prov_kerman', 4, NOW()),
('city_h1', 'همدان', 'prov_hamadan', 0, NOW()),
('city_h2', 'ملایر', 'prov_hamadan', 1, NOW()),
('city_h3', 'نهاوند', 'prov_hamadan', 2, NOW()),
('city_h4', 'تویسرکان', 'prov_hamadan', 3, NOW()),
('city_h5', 'کبودرآهنگ', 'prov_hamadan', 4, NOW()),
('city_ko1', 'سنندج', 'prov_kordestan', 0, NOW()),
('city_ko2', 'مریوان', 'prov_kordestan', 1, NOW()),
('city_ko3', 'سقز', 'prov_kordestan', 2, NOW()),
('city_ko4', 'بانه', 'prov_kordestan', 3, NOW()),
('city_ko5', 'قروه', 'prov_kordestan', 4, NOW()),
('city_z1', 'زنجان', 'prov_zanjan', 0, NOW()),
('city_z2', 'ابهر', 'prov_zanjan', 1, NOW()),
('city_z3', 'خدابنده', 'prov_zanjan', 2, NOW()),
('city_z4', 'قیدار', 'prov_zanjan', 3, NOW()),
('city_z5', 'ماهنشان', 'prov_zanjan', 4, NOW()),
('city_l1', 'خرم‌آباد', 'prov_lorestan', 0, NOW()),
('city_l2', 'بروجرد', 'prov_lorestan', 1, NOW()),
('city_l3', 'دورود', 'prov_lorestan', 2, NOW()),
('city_l4', 'ازنا', 'prov_lorestan', 3, NOW()),
('city_l5', 'الیگودرز', 'prov_lorestan', 4, NOW()),
('city_qz1', 'قزوین', 'prov_qazvin', 0, NOW()),
('city_qz2', 'تاکستان', 'prov_qazvin', 1, NOW()),
('city_qz3', 'آبیک', 'prov_qazvin', 2, NOW()),
('city_qz4', 'بوئین‌زهرا', 'prov_qazvin', 3, NOW()),
('city_ar1', 'اردبیل', 'prov_ardabil', 0, NOW()),
('city_ar2', 'خلخال', 'prov_ardabil', 1, NOW()),
('city_ar3', 'مشگین‌شهر', 'prov_ardabil', 2, NOW()),
('city_ar4', 'پارس‌آباد', 'prov_ardabil', 3, NOW()),
('city_ar5', 'نیر', 'prov_ardabil', 4, NOW()),
('city_b1', 'بوشهر', 'prov_bushehr', 0, NOW()),
('city_b2', 'برازجان', 'prov_bushehr', 1, NOW()),
('city_b3', 'گناوه', 'prov_bushehr', 2, NOW()),
('city_b4', 'دیر', 'prov_bushehr', 3, NOW()),
('city_b5', 'کنگان', 'prov_bushehr', 4, NOW()),
('city_s1', 'سمنان', 'prov_semnan', 0, NOW()),
('city_s2', 'شاهرود', 'prov_semnan', 1, NOW()),
('city_s3', 'دامغان', 'prov_semnan', 2, NOW()),
('city_s4', 'گرمسار', 'prov_semnan', 3, NOW()),
('city_s5', 'مهدی‌شهر', 'prov_semnan', 4, NOW()),
('city_go1', 'گرگان', 'prov_golestan', 0, NOW()),
('city_go2', 'گنبد کاووس', 'prov_golestan', 1, NOW()),
('city_go3', 'علی‌آباد', 'prov_golestan', 2, NOW()),
('city_go4', 'آق‌قلا', 'prov_golestan', 3, NOW()),
('city_go5', 'کردکوی', 'prov_golestan', 4, NOW()),
('city_si1', 'زاهدان', 'prov_sistan', 0, NOW()),
('city_si2', 'زابل', 'prov_sistan', 1, NOW()),
('city_si3', 'چابهار', 'prov_sistan', 2, NOW()),
('city_si4', 'ایرانشهر', 'prov_sistan', 3, NOW()),
('city_si5', 'سراوان', 'prov_sistan', 4, NOW()),
('city_ke1', 'کرمانشاه', 'prov_kermanshah', 0, NOW()),
('city_ke2', 'اسلام‌آباد', 'prov_kermanshah', 1, NOW()),
('city_ke3', 'پاوه', 'prov_kermanshah', 2, NOW()),
('city_ke4', 'سنقر', 'prov_kermanshah', 3, NOW()),
('city_ke5', 'هرسین', 'prov_kermanshah', 4, NOW()),
('city_ho1', 'بندرعباس', 'prov_hormozgan', 0, NOW()),
('city_ho2', 'قشم', 'prov_hormozgan', 1, NOW()),
('city_ho3', 'میناب', 'prov_hormozgan', 2, NOW()),
('city_ho4', 'جاسک', 'prov_hormozgan', 3, NOW()),
('city_ho5', 'حاجی‌آباد', 'prov_hormozgan', 4, NOW()),
('city_il1', 'ایلام', 'prov_ilam', 0, NOW()),
('city_il2', 'ایوان', 'prov_ilam', 1, NOW()),
('city_il3', 'دهلران', 'prov_ilam', 2, NOW()),
('city_il4', 'مهران', 'prov_ilam', 3, NOW()),
('city_il5', 'آبدانان', 'prov_ilam', 4, NOW()),
('city_ch1', 'شهرکرد', 'prov_chaharmahal', 0, NOW()),
('city_ch2', 'بروجن', 'prov_chaharmahal', 1, NOW()),
('city_ch3', 'فارسان', 'prov_chaharmahal', 2, NOW()),
('city_ch4', 'لردگان', 'prov_chaharmahal', 3, NOW()),
('city_ch5', 'چلگرد', 'prov_chaharmahal', 4, NOW()),
('city_kj1', 'بیرجند', 'prov_khorasan_jonoobi', 0, NOW()),
('city_kj2', 'قائن', 'prov_khorasan_jonoobi', 1, NOW()),
('city_kj3', 'فردوس', 'prov_khorasan_jonoobi', 2, NOW()),
('city_kj4', 'طبس', 'prov_khorasan_jonoobi', 3, NOW()),
('city_kj5', 'سرایان', 'prov_khorasan_jonoobi', 4, NOW()),
('city_ks1', 'بجنورد', 'prov_khorasan_shomali', 0, NOW()),
('city_ks2', 'اسفراین', 'prov_khorasan_shomali', 1, NOW()),
('city_ks3', 'جاجرم', 'prov_khorasan_shomali', 2, NOW()),
('city_ks4', 'شیروان', 'prov_khorasan_shomali', 3, NOW()),
('city_ks5', 'فاروج', 'prov_khorasan_shomali', 4, NOW()),
('city_kb1', 'یاسوج', 'prov_kohgiluyeh', 0, NOW()),
('city_kb2', 'گچساران', 'prov_kohgiluyeh', 1, NOW()),
('city_kb3', 'دنا', 'prov_kohgiluyeh', 2, NOW()),
('city_kb4', 'دوگنبدان', 'prov_kohgiluyeh', 3, NOW());

-- -----------------------------------------------------------------------------
-- 5. Unknown Person (نامشخص عمومی)
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO person (id, firstName, lastName, isFamous, status, createdAt, updatedAt) VALUES
('pers_unknown', 'نامشخص', 'عمومی', 0, 'approved', NOW(), NOW());

-- -----------------------------------------------------------------------------
-- 6. Famous People
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO person (id, firstName, lastName, nationalCode, title, isFamous, status, createdAt, updatedAt) VALUES
('pers_1', 'علی', 'خامنه‌ای', '0011223344', 'رهبر جمهوری اسلامی', 1, 'approved', NOW(), NOW()),
('pers_2', 'روح‌الله', 'خمینی', '0011223345', 'بنیان‌گذار جمهوری اسلامی', 1, 'approved', NOW(), NOW()),
('pers_3', 'علی‌اکبر', 'هاشمی رفسنجانی', '0011223346', 'رئیس‌جمهور سابق', 1, 'approved', NOW(), NOW()),
('pers_4', 'محمد', 'خاتمی', '0011223347', 'رئیس‌جمهور سابق', 1, 'approved', NOW(), NOW()),
('pers_5', 'محمود', 'احمدی‌نژاد', '0011223348', 'رئیس‌جمهور سابق', 1, 'approved', NOW(), NOW()),
('pers_6', 'حسن', 'روحانی', '0011223349', 'رئیس‌جمهور سابق', 1, 'approved', NOW(), NOW()),
('pers_7', 'ابراهیم', 'رئیسی', '0011223350', 'رئیس‌جمهور سابق', 1, 'approved', NOW(), NOW()),
('pers_8', 'مسعود', 'پزشکیان', '0011223351', 'رئیس‌جمهور', 1, 'approved', NOW(), NOW()),
('pers_9', 'محمدجواد', 'ظریف', '0011223352', 'وزیر امور خارجه سابق', 1, 'approved', NOW(), NOW()),
('pers_10', 'علی', 'لاریجانی', '0011223353', 'رئیس سابق مجلس', 1, 'approved', NOW(), NOW()),
('pers_11', 'محمدباقر', 'قالیباف', '0011223354', 'رئیس مجلس', 1, 'approved', NOW(), NOW()),
('pers_12', 'سعید', 'جلیلی', '0011223355', 'مذاکره‌کننده سابق هسته‌ای', 1, 'approved', NOW(), NOW()),
('pers_13', 'محسن', 'رضایی', '0011223356', 'فرمانده سابق سپاه', 1, 'approved', NOW(), NOW()),
('pers_14', 'احمد', 'جنتی', '0011223357', 'دبیر شورای نگهبان', 1, 'approved', NOW(), NOW()),
('pers_15', 'مجتبی', 'خامنه‌ای', '0011223358', 'روحانی و چهره سیاسی', 1, 'approved', NOW(), NOW());


-- -----------------------------------------------------------------------------
-- NOTE: These require password hashes from better-auth/crypto - run pnpm run prisma:seed:
-- - Admin user (admin@example.com / Admin123!)
-- - Demo invite token (demo-token-invite-2024 / demo123) + invite-demo user
-- -----------------------------------------------------------------------------
SELECT 'SQL seed done. Categories, provinces, cities, persons, invite codes, settings, admin panel.' AS message;
