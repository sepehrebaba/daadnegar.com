import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";
import { hashPassword } from "better-auth/crypto";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "127.0.0.1",
  port: Number(process.env.DATABASE_PORT) || 3307,
  user: process.env.DATABASE_USER || "dadban",
  password: process.env.DATABASE_PASSWORD || "dadban_secret",
  database: process.env.DATABASE_NAME || "dadban",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

const FIRST_USER_EMAIL = process.env.SEED_FIRST_USER_EMAIL || "admin@example.com";
const FIRST_USER_NAME = process.env.SEED_FIRST_USER_NAME || "Admin";
const FIRST_USER_PASSWORD = process.env.SEED_FIRST_USER_PASSWORD || "Admin123!";

const FAMOUS_PEOPLE = [
  { firstName: "علی", lastName: "خامنه‌ای", nationalCode: "0011223344", title: "رهبر جمهوری اسلامی" },
  {
    firstName: "روح‌الله",
    lastName: "خمینی",
    nationalCode: "0011223345",
    title: "بنیان‌گذار جمهوری اسلامی",
  },
  {
    firstName: "علی‌اکبر",
    lastName: "هاشمی رفسنجانی",
    nationalCode: "0011223346",
    title: "رئیس‌جمهور سابق",
  },
  { firstName: "محمد", lastName: "خاتمی", nationalCode: "0011223347", title: "رئیس‌جمهور سابق" },
  {
    firstName: "محمود",
    lastName: "احمدی‌نژاد",
    nationalCode: "0011223348",
    title: "رئیس‌جمهور سابق",
  },
  { firstName: "حسن", lastName: "روحانی", nationalCode: "0011223349", title: "رئیس‌جمهور سابق" },
  { firstName: "ابراهیم", lastName: "رئیسی", nationalCode: "0011223350", title: "رئیس‌جمهور سابق" },
  { firstName: "مسعود", lastName: "پزشکیان", nationalCode: "0011223351", title: "رئیس‌جمهور" },
  {
    firstName: "محمدجواد",
    lastName: "ظریف",
    nationalCode: "0011223352",
    title: "وزیر امور خارجه سابق",
  },
  { firstName: "علی", lastName: "لاریجانی", nationalCode: "0011223353", title: "رئیس سابق مجلس" },
  { firstName: "محمدباقر", lastName: "قالیباف", nationalCode: "0011223354", title: "رئیس مجلس" },
  {
    firstName: "سعید",
    lastName: "جلیلی",
    nationalCode: "0011223355",
    title: "مذاکره‌کننده سابق هسته‌ای",
  },
  { firstName: "محسن", lastName: "رضایی", nationalCode: "0011223356", title: "فرمانده سابق سپاه" },
  { firstName: "احمد", lastName: "جنتی", nationalCode: "0011223357", title: "دبیر شورای نگهبان" },
  {
    firstName: "مجتبی",
    lastName: "خامنه‌ای",
    nationalCode: "0011223358",
    title: "روحانی و چهره سیاسی",
  },
];

const REPORT_CATEGORIES = [
  {
    slug: "bribery",
    name: "رشوه",
    subcategories: [
      { slug: "cash", name: "نقدی" },
      { slug: "gift", name: "هدیه/خدمات" },
      { slug: "promise", name: "وعده منصب/امتیاز" },
    ],
  },
  {
    slug: "embezzlement",
    name: "اختلاس",
    subcategories: [
      { slug: "budget", name: "بودجه دولتی" },
      { slug: "public", name: "اموال عمومی" },
    ],
  },
  {
    slug: "nepotism",
    name: "پارتی‌بازی و رانت",
    subcategories: [
      { slug: "hiring", name: "استخدام غیرعادلانه" },
      { slug: "contract", name: "واگذاری قرارداد" },
    ],
  },
  {
    slug: "abuse",
    name: "سوءاستفاده از قدرت",
    subcategories: [
      { slug: "position", name: "سوءاستفاده از موقعیت" },
      { slug: "threat", name: "تهدید و ارعاب" },
    ],
  },
  { slug: "other", name: "سایر", subcategories: [{ slug: "other", name: "موارد دیگر" }] },
];

const IRAN_PROVINCES_AND_CITIES: { province: string; cities: string[] }[] = [
  { province: "تهران", cities: ["تهران", "اسلامشهر", "پاکدشت", "شهریار", "ورامین", "رباط‌کریم"] },
  { province: "اصفهان", cities: ["اصفهان", "کاشان", "نجف‌آباد", "خمینی‌شهر", "شاهین‌شهر"] },
  { province: "فارس", cities: ["شیراز", "مرودشت", "جهرم", "کازرون", "آباده"] },
  { province: "خراسان رضوی", cities: ["مشهد", "نیشابور", "سبزوار", "تربت حیدریه", "قوچان"] },
  { province: "خوزستان", cities: ["اهواز", "دزفول", "آبادان", "خرمشهر", "اندیمشک"] },
  { province: "آذربایجان شرقی", cities: ["تبریز", "مراغه", "مرند", "میانه", "بناب"] },
  { province: "آذربایجان غربی", cities: ["ارومیه", "خوی", "مهاباد", "سلماس", "بوکان"] },
  { province: "مازندران", cities: ["ساری", "بابل", "آمل", "قائم‌شهر", "تنکابن"] },
  { province: "گیلان", cities: ["رشت", "انزلی", "لاهیجان", "لنگرود", "رودسر"] },
  { province: "البرز", cities: ["کرج", "هشتگرد", "نظرآباد", "طالقان"] },
  { province: "قم", cities: ["قم"] },
  { province: "مرکزی", cities: ["اراک", "ساوه", "خمین", "محلات", "دلیجان"] },
  { province: "یزد", cities: ["یزد", "مهریز", "اردکان", "میبد", "بافق"] },
  { province: "کرمان", cities: ["کرمان", "رفسنجان", "سیرجان", "بردسیر", "جیرفت"] },
  { province: "همدان", cities: ["همدان", "ملایر", "نهاوند", "تویسرکان", "کبودرآهنگ"] },
  { province: "کردستان", cities: ["سنندج", "مریوان", "سقز", "بانه", "قروه"] },
  { province: "زنجان", cities: ["زنجان", "ابهر", "خدابنده", "قیدار", "ماهنشان"] },
  { province: "لرستان", cities: ["خرم‌آباد", "بروجرد", "دورود", "ازنا", "الیگودرز"] },
  { province: "قزوین", cities: ["قزوین", "تاکستان", "آبیک", "بوئین‌زهرا"] },
  { province: "اردبیل", cities: ["اردبیل", "خلخال", "مشگین‌شهر", "پارس‌آباد", "نیر"] },
  { province: "بوشهر", cities: ["بوشهر", "برازجان", "گناوه", "دیر", "کنگان"] },
  { province: "سمنان", cities: ["سمنان", "شاهرود", "دامغان", "گرمسار", "مهدی‌شهر"] },
  { province: "گلستان", cities: ["گرگان", "گنبد کاووس", "علی‌آباد", "آق‌قلا", "کردکوی"] },
  { province: "سیستان و بلوچستان", cities: ["زاهدان", "زابل", "چابهار", "ایرانشهر", "سراوان"] },
  { province: "کرمانشاه", cities: ["کرمانشاه", "اسلام‌آباد", "پاوه", "سنقر", "هرسین"] },
  { province: "هرمزگان", cities: ["بندرعباس", "قشم", "میناب", "جاسک", "حاجی‌آباد"] },
  { province: "ایلام", cities: ["ایلام", "ایوان", "دهلران", "مهران", "آبدانان"] },
  { province: "چهارمحال و بختیاری", cities: ["شهرکرد", "بروجن", "فارسان", "لردگان", "چلگرد"] },
  { province: "خراسان جنوبی", cities: ["بیرجند", "قائن", "فردوس", "طبس", "سرایان"] },
  { province: "خراسان شمالی", cities: ["بجنورد", "اسفراین", "جاجرم", "شیروان", "فاروج"] },
  { province: "کهگیلویه و بویراحمد", cities: ["یاسوج", "گچساران", "دنا", "دوگنبدان"] },
];

async function seedUser() {
  const existing = await prisma.user.findFirst();
  if (existing) {
    console.log("Users already exist, skipping user seed.");
    return;
  }

  const hashedPassword = await hashPassword(FIRST_USER_PASSWORD);
  const user = await prisma.user.create({
    data: {
      name: FIRST_USER_NAME,
      email: FIRST_USER_EMAIL,
      accounts: {
        create: {
          accountId: FIRST_USER_EMAIL,
          providerId: "credential",
          password: hashedPassword,
        },
      },
    },
  });

  await prisma.admin.create({
    data: { userId: user.id },
  });

  console.log("First user created as admin:", user.email);
}

async function seedInviteCodes() {
  await prisma.inviteCode.createMany({
    data: [
      { code: "INVITE2024", isActive: true },
      { code: "TEST123", isActive: true },
      { code: "DEMO456", isActive: true },
    ],
    skipDuplicates: true,
  });
  console.log("Invite codes seeded.");
}

async function seedCategories() {
  const existing = await prisma.category.count();
  if (existing > 0) {
    console.log("Categories already exist, skipping.");
    return;
  }

  for (let i = 0; i < REPORT_CATEGORIES.length; i++) {
    const cat = REPORT_CATEGORIES[i];
    const parent = await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        type: "report",
        sortOrder: i,
      },
    });
    for (let j = 0; j < cat.subcategories.length; j++) {
      const sub = cat.subcategories[j];
      await prisma.category.create({
        data: {
          name: sub.name,
          slug: sub.slug,
          type: "report",
          sortOrder: j,
          parentId: parent.id,
        },
      });
    }
  }
  console.log("Categories seeded.");
}

async function seedProvincesAndCities() {
  const existing = await prisma.province.count();
  if (existing > 0) {
    console.log("Provinces already exist, skipping.");
    return;
  }

  for (let i = 0; i < IRAN_PROVINCES_AND_CITIES.length; i++) {
    const { province: provinceName, cities } = IRAN_PROVINCES_AND_CITIES[i];
    const province = await prisma.province.create({
      data: {
        name: provinceName,
        sortOrder: i,
      },
    });
    for (let j = 0; j < cities.length; j++) {
      await prisma.city.create({
        data: {
          name: cities[j],
          provinceId: province.id,
          sortOrder: j,
        },
      });
    }
  }
  console.log("Provinces and cities seeded.");
}

async function seedUnknownPerson() {
  const existing = await prisma.person.findFirst({
    where: { firstName: "نامشخص", lastName: "عمومی" },
  });
  if (existing) {
    console.log("Unknown person already exists, skipping.");
    return;
  }
  await prisma.person.create({
    data: { firstName: "نامشخص", lastName: "عمومی", isFamous: false },
  });
  console.log("Unknown person seeded.");
}

async function seedFamousPeople() {
  const existing = await prisma.person.count({ where: { isFamous: true } });
  if (existing > 0) {
    console.log("Famous people already exist, skipping.");
    return;
  }

  await prisma.person.createMany({
    data: FAMOUS_PEOPLE.map((p) => ({
      firstName: p.firstName,
      lastName: p.lastName,
      nationalCode: p.nationalCode,
      title: p.title,
      isFamous: true,
    })),
  });
  console.log("Famous people seeded.");
}

async function main() {
  await seedUser();
  await seedInviteCodes();
  await seedCategories();
  await seedProvincesAndCities();
  await seedUnknownPerson();
  await seedFamousPeople();
  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
