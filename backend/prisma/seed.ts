import { PrismaClient, Role, StoreStatus, DiscountType, OrderStatus, PaymentMethod } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function validateEnv() {
  const required = ['ADMIN_EMAIL', 'ADMIN_PHONE', 'ADMIN_PASSWORD'];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  if (process.env.ADMIN_PASSWORD!.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters long');
  }
}

async function main() {
  console.log('🌱 Starting database seed...');
  await validateEnv();

  // 1. Create Admin User
  const adminPasswordHash = await argon2.hash(process.env.ADMIN_PASSWORD!);
  const admin = await prisma.user.upsert({
    where: { phone: process.env.ADMIN_PHONE! },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL!,
      phone: process.env.ADMIN_PHONE!,
      passwordHash: adminPasswordHash,
      name: 'System Administrator',
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Admin created: ${admin.name} (${admin.phone})`);

  // 2. Create Categories (Tree structure)
  const categoriesData = [
    { name: 'إلكترونيات', icon: '', children: [
      { name: 'هواتف ذكية', icon: '' },
      { name: 'أجهزة لابتوب', icon: '' },
      { name: 'إكسسوارات', icon: '' },
    ]},
    { name: 'ملابس', icon: '', children: [
      { name: 'ملابس رجالية', icon: '' },
      { name: 'ملابس نسائية', icon: '' },
      { name: 'ملابس أطفال', icon: '' },
    ]},
    { name: 'أغذية', icon: '', children: [
      { name: 'فواكه وخضروات', icon: '' },
      { name: 'منتجات ألبان', icon: '' },
      { name: 'معلبات', icon: '' },
    ]},
    { name: 'مستلزمات منزلية', icon: '', children: [
      { name: 'أدوات تنظيف', icon: '' },
      { name: 'ديكور', icon: '' },
      { name: 'أثاث', icon: '' },
    ]},
  ];

  const createdCategories: Map<string, string> = new Map(); // name -> id

  for (const parentCat of categoriesData) {
    const parent = await prisma.category.upsert({
      where: { id: parentCat.name },
      update: {},
      create: {
        name: parentCat.name,
        icon: parentCat.icon,
      },
    });
    createdCategories.set(parentCat.name, parent.id);
    console.log(`✅ Category: ${parent.name}`);

    for (const child of parentCat.children) {
      const childCat = await prisma.category.upsert({
        where: { id: child.name },
        update: {},
        create: {
          name: child.name,
          icon: child.icon,
          parentId: parent.id,
        },
      });
      createdCategories.set(child.name, childCat.id);
      console.log(`   └─ ${childCat.name}`);
    }
  }

  // 3. Create Demo Stores (3 stores with Arabic placeholder names)
  const storeOwners = [
    { userPhone: '+963991111111', storePhone: '+963161234567', email: 'store1@demo.local', name: 'صاحب المتجر الأول', storeName: 'متجر الهدايا الشرقية', description: 'متجر متخصص بالهدايا والتحف الشرقية الأصيلة', address: 'السوق القديم، السويداء' },
    { userPhone: '+963992222222', storePhone: '+963167654321', email: 'store2@demo.local', name: 'صاحب المتجر الثاني', storeName: 'سوق الإلكترونيات الحديث', description: 'أحدث الأجهزة الإلكترونية بأسعار منافسة', address: 'شارع الجلاء، السويداء' },
    { userPhone: '+963993333333', storePhone: '+963165555555', email: 'store3@demo.local', name: 'صاحب المتجر الثالث', storeName: 'أزياء السويدية', description: 'ملابس عصرية ومحلية للرجال والنساء والأطفال', address: 'سوق السويداء المركزي' },
  ];

  if (process.env.NODE_ENV === 'production') {
    console.log('Production seed completed; demo accounts and data were skipped.');
    return;
  }

  const createdStores: Array<{ id: string; ownerId: string }> = [];

  for (const owner of storeOwners) {
    const ownerPasswordHash = await argon2.hash('StorePass123!');
    const merchant = await prisma.user.upsert({
      where: { phone: owner.userPhone },
      update: {},
      create: {
        email: owner.email,
        phone: owner.userPhone,
        passwordHash: ownerPasswordHash,
        name: owner.name,
        role: Role.MERCHANT,
        isActive: true,
      },
    });

    const store = await prisma.store.upsert({
      where: { id: owner.storeName },
      update: {},
      create: {
        ownerUserId: merchant.id,
        name: owner.storeName,
        description: owner.description,
        address: owner.address,
        phone: owner.storePhone,
        workingHours: {
          open: '09:00',
          close: '21:00',
          days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        },
        status: StoreStatus.ACTIVE,
      },
    });
    createdStores.push({ id: store.id, ownerId: merchant.id });
    console.log(`✅ Store: ${store.name} (Owner: ${merchant.name})`);
  }

  // 4. Create 5 Products per Store (Arabic placeholder names)
  const productTemplates = [
    { name: 'منتج تجريبي 1', description: 'وصف المنتج التجريبي الأول', price: 15000, stock: 25, categoryNames: ['إكسسوارات'] },
    { name: 'منتج تجريبي 2', description: 'وصف المنتج التجريبي الثاني', price: 25000, stock: 15, categoryNames: ['إكسسوارات', 'هواتف ذكية'] },
    { name: 'منتج تجريبي 3', description: 'وصف المنتج التجريبي الثالث', price: 8000, stock: 50, categoryNames: ['ملابس رجالية', 'ملابس نسائية'] },
    { name: 'منتج تجريبي 4', description: 'وصف المنتج التجريبي الرابع', price: 12000, stock: 30, categoryNames: ['فواكه وخضروات', 'منتجات ألبان'] },
    { name: 'منتج تجريبي 5', description: 'وصف المنتج التجريبي الخامس', price: 5000, stock: 100, categoryNames: ['أدوات تنظيف', 'ديكور'] },
  ];

  for (const store of createdStores) {
    for (let i = 0; i < productTemplates.length; i++) {
      const template = productTemplates[i];
      const categoryName = template.categoryNames[Math.floor(Math.random() * template.categoryNames.length)];
      const categoryId = createdCategories.get(categoryName);

      if (!categoryId) {
        console.warn(`⚠️ Category not found: ${categoryName}`);
        continue;
      }

      const product = await prisma.product.create({
        data: {
          storeId: store.id,
          categoryId,
          name: `${template.name} - ${store.id.slice(0, 8)}`,
          description: template.description,
          price: template.price + Math.floor(Math.random() * 5000),
          stock: template.stock,
          isAvailable: true,
          images: {
            create: [
              { url: `https://picsum.photos/seed/${store.id}-${i}/400/400.webp`, sortOrder: 0 },
              { url: `https://picsum.photos/seed/${store.id}-${i}-2/400/400.webp`, sortOrder: 1 },
            ],
          },
        },
      });
      console.log(`   ✅ Product: ${product.name} (${product.price} ل.س) in ${categoryName}`);
    }
  }

  // 5. Create Demo Offers
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  for (const store of createdStores) {
    const storeProducts = await prisma.product.findMany({ where: { storeId: store.id }, take: 2 });
    for (const product of storeProducts) {
      await prisma.offer.create({
        data: {
          storeId: store.id,
          productId: product.id,
          title: `عرض خاص على ${product.name}`,
          discountType: DiscountType.PERCENT,
          discountValue: 15,
          startsAt: now,
          endsAt: nextWeek,
          isActive: true,
        },
      });
    }
  }
  console.log('✅ Offers created');

  // 6. Create Demo Driver
  const driverPasswordHash = await argon2.hash('DriverPass123!');
  const driverUser = await prisma.user.upsert({
    where: { phone: '+963994444444' },
    update: {},
    create: {
      email: 'driver@demo.local',
      phone: '+963994444444',
      passwordHash: driverPasswordHash,
      name: 'أحمد السائق',
      role: Role.DRIVER,
      isActive: true,
    },
  });
  await prisma.driver.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      userId: driverUser.id,
      vehicle: 'دراجة نارية - سوزوكي',
      isOnline: true,
    },
  });
  console.log('✅ Driver created: أحمد السائق');

  console.log('\n🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });