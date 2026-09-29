import { prisma } from './prisma';

async function main() {
  console.log('🌱 Seeding Driver & Vehicle Service database...');

  // Clean existing tables
  await prisma.driverLocation.deleteMany();
  await prisma.serviceArea.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();

  // Create Driver 1 (Active, Available, Sedan)
  const driver1 = await prisma.driver.create({
    data: {
      id: 'drv_active_001',
      accountId: 'acc_driver_001',
      licenseNumber: 'DL-9081234',
      licenseExpiry: new Date('2029-12-31'),
      driverStatus: 'ACTIVE',
      availabilityStatus: 'AVAILABLE',
      vehicle: {
        create: {
          id: 'veh_001',
          registrationNumber: 'CAB-4589',
          vehicleType: 'SEDAN',
          make: 'Toyota',
          model: 'Prius',
          year: 2022,
          color: 'Silver',
          capacity: 4,
          vehicleStatus: 'APPROVED',
        },
      },
      serviceArea: {
        create: {
          id: 'sa_001',
          city: 'Colombo',
          zoneName: 'Colombo Central & Fort',
          centerLatitude: 6.9271,
          centerLongitude: 79.8612,
          radiusKm: 15.0,
        },
      },
      location: {
        create: {
          id: 'loc_001',
          latitude: 6.9271,
          longitude: 79.8612,
          heading: 90.0,
        },
      },
    },
  });

  // Create Driver 2 (Active, Available, SUV)
  const driver2 = await prisma.driver.create({
    data: {
      id: 'drv_active_002',
      accountId: 'acc_driver_002',
      licenseNumber: 'DL-7765432',
      licenseExpiry: new Date('2030-06-30'),
      driverStatus: 'ACTIVE',
      availabilityStatus: 'AVAILABLE',
      vehicle: {
        create: {
          id: 'veh_002',
          registrationNumber: 'CAD-8812',
          vehicleType: 'SUV',
          make: 'Honda',
          model: 'CR-V',
          year: 2023,
          color: 'Black',
          capacity: 6,
          vehicleStatus: 'APPROVED',
        },
      },
      serviceArea: {
        create: {
          id: 'sa_002',
          city: 'Kandy',
          zoneName: 'Kandy City Center',
          centerLatitude: 7.2906,
          centerLongitude: 80.6337,
          radiusKm: 20.0,
        },
      },
      location: {
        create: {
          id: 'loc_002',
          latitude: 7.2906,
          longitude: 80.6337,
          heading: 180.0,
        },
      },
    },
  });

  // Create Driver 3 (Inactive, Unavailable)
  const driver3 = await prisma.driver.create({
    data: {
      id: 'drv_inactive_003',
      accountId: 'acc_driver_003',
      licenseNumber: 'DL-1122334',
      licenseExpiry: new Date('2027-01-15'),
      driverStatus: 'INACTIVE',
      availabilityStatus: 'UNAVAILABLE',
      vehicle: {
        create: {
          id: 'veh_003',
          registrationNumber: 'NC-9900',
          vehicleType: 'VAN',
          make: 'Nissan',
          model: 'Caravan',
          year: 2020,
          color: 'White',
          capacity: 10,
          vehicleStatus: 'APPROVED',
        },
      },
    },
  });

  console.log(`✅ Database seeded successfully with 3 driver profiles:`);
  console.log(` - Driver 1: ${driver1.id} (Active, Available, Sedan)`);
  console.log(` - Driver 2: ${driver2.id} (Active, Available, SUV)`);
  console.log(` - Driver 3: ${driver3.id} (Inactive, Unavailable, Van)`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
