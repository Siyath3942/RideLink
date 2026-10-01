import { prisma } from './prisma';

/**
 * Seed script for Fare & Payment Service.
 * Creates sample fare estimates, payments, and receipts for development/testing.
 */
async function seed() {
  console.log('🌱 Seeding Fare & Payment Service database...');

  // Clear existing data
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.fareEstimate.deleteMany();

  // Create sample fare estimates
  const estimate1 = await prisma.fareEstimate.create({
    data: {
      rideId: 'ride-001',
      passengerId: 'passenger-001',
      distanceKm: 5.0,
      baseFare: 150,
      distanceFare: 400,
      bookingFee: 30,
      totalFare: 580,
      currency: 'LKR',
    },
  });

  const estimate2 = await prisma.fareEstimate.create({
    data: {
      rideId: 'ride-002',
      passengerId: 'passenger-002',
      distanceKm: 1.0,
      baseFare: 150,
      distanceFare: 80,
      bookingFee: 30,
      totalFare: 260,
      currency: 'LKR',
    },
  });

  console.log(`  ✅ Created ${2} fare estimates`);

  // Create sample payments
  const payment1 = await prisma.payment.create({
    data: {
      rideId: 'ride-001',
      passengerId: 'passenger-001',
      amount: 580,
      paymentMethod: 'CARD',
      status: 'SUCCESS',
      transactionReference: 'TXN-SEED-001',
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      rideId: 'ride-002',
      passengerId: 'passenger-002',
      amount: 260,
      paymentMethod: 'CASH',
      status: 'SUCCESS',
      transactionReference: 'TXN-SEED-002',
    },
  });

  const payment3 = await prisma.payment.create({
    data: {
      rideId: 'ride-003',
      passengerId: 'passenger-001',
      amount: 350,
      paymentMethod: 'WALLET',
      status: 'FAILED',
      transactionReference: 'TXN-SEED-003',
    },
  });

  console.log(`  ✅ Created ${3} payments`);

  // Create receipts for successful payments only
  await prisma.receipt.create({
    data: {
      paymentId: payment1.id,
      rideId: payment1.rideId,
      passengerId: payment1.passengerId,
      amount: payment1.amount,
      currency: 'LKR',
      paymentMethod: payment1.paymentMethod,
    },
  });

  await prisma.receipt.create({
    data: {
      paymentId: payment2.id,
      rideId: payment2.rideId,
      passengerId: payment2.passengerId,
      amount: payment2.amount,
      currency: 'LKR',
      paymentMethod: payment2.paymentMethod,
    },
  });

  console.log(`  ✅ Created ${2} receipts (only for successful payments)`);

  console.log('🌱 Seeding complete!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
