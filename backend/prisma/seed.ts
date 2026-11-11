import { PrismaClient, Role, StoreStatus, DiscountType } from '@prisma/client';
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

async function getOrCreateCategory(name: string, icon: string, parentId: string | null = null) {
  const existing = await prisma.category.findFirst({
    where: { name, parentId },
  });

  if (existing) {
    return prisma.category.update({
      where: { id: existing.id },
      data: { icon },
    });
  }

  return prisma.category.create({
    data: { name, icon, parentId },
  });
}

async function main() {
  console.log('🌱 Starting database seed...');
  await validateEnv();

  // 1. Create Admin User
  const adminPasswordHash = await argon2.hash(process.env.ADMIN_PASSWORD!);
  const existingAdmin = await prisma.user.findUnique({
    where: { phone: process.env.ADMIN_PHONE! },
  });

  if (existingAdmin && existingAdmin.role !== Role.ADMIN) {
    throw new Error('ADMIN_PHONE is already assigned to a non-admin user');
  }

  const admin = existingAdmin
    ? await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        email: process.env.ADMIN_EMAIL!,
        passwordHash: adminPasswordHash,
        name: 'System Administrator',
        isActive: true,
      },
    })
    : await prisma.user.create({
      data: {
        email: process.env.ADMIN_EMAIL!,
        phone: process.env.ADMIN_PHONE!,
        passwordHash: adminPasswordHash,
        name: 'System Administrator',
        role: Role.ADMIN,
        isActive: true,
      },
    });
  console.log(`✅ Admin ready: ${admin.name}`);

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
    const parent = await getOrCreateCategory(parentCat.name, parentCat.icon);
    createdCategories.set(parentCat.name, parent.id);
    console.log(`✅ Category: ${parent.name}`);

    for (const child of parentCat.children) {
      const childCat = await getOrCreateCategory(child.name, child.icon, parent.id);
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

  const createdStores: Array<{ id: string }> = [];

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

    const existingStore = await prisma.store.findFirst({
      where: { ownerUserId: merchant.id, name: owner.storeName },
    });
    const store = existingStore
      ? await prisma.store.update({
        where: { id: existingStore.id },
        data: {
          description: owner.description,
          address: owner.address,
          phone: owner.storePhone,
        },
      })
      : await prisma.store.create({
        data: {
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
    createdStores.push({ id: store.id });
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
      const categoryName = template.categoryNames[0];
      const categoryId = createdCategories.get(categoryName);

      if (!categoryId) {
        throw new Error(`Seed category not found: ${categoryName}`);
      }

      const productName = `${template.name} - ${store.id.slice(0, 8)}`;
      const existingProduct = await prisma.product.findFirst({
        where: { storeId: store.id, name: productName },
      });
      const product = existingProduct
        ? existingProduct
        : await prisma.product.create({
          data: {
            storeId: store.id,
            categoryId,
            name: productName,
            description: template.description,
            price: template.price,
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
      const offerData = {
        title: `عرض خاص على ${product.name}`,
        discountType: DiscountType.PERCENT,
        discountValue: 15,
        startsAt: now,
        endsAt: nextWeek,
        isActive: true,
      };
      const existingOffer = await prisma.offer.findFirst({
        where: { storeId: store.id, productId: product.id },
      });
      if (existingOffer) {
        await prisma.offer.update({
          where: { id: existingOffer.id },
          data: offerData,
        });
      } else {
        await prisma.offer.create({
          data: {
            storeId: store.id,
            productId: product.id,
            ...offerData,
          },
        });
      }
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