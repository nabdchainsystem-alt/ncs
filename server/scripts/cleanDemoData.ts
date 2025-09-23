import { prisma } from '../src/prisma';

async function main() {
  const summary: Record<string, number> = {};

  async function wipe(label: string, action: () => Promise<{ count: number } | void>) {
    const result = await action();
    summary[label] = result && 'count' in result && typeof result.count === 'number' ? result.count : 0;
  }

  await wipe('stockMovement', () => prisma.stockMovement.deleteMany({}));
  await wipe('inventoryItem', () => prisma.inventoryItem.deleteMany({}));
  await wipe('maintenanceRecord', () => prisma.maintenanceRecord.deleteMany({}));
  await wipe('vehicle', () => prisma.vehicle.deleteMany({}));
  await wipe('rfq', () => prisma.rfq.deleteMany({}));
  await wipe('order', () => prisma.order.deleteMany({}));
  await wipe('requestItem', () => prisma.requestItem.deleteMany({}));
  await wipe('request', () => prisma.request.deleteMany({}));

  try {
    await wipe('vendorPerformanceHistory', () => prisma.vendorPerformanceHistory.deleteMany({}));
  } catch (error) {
    console.warn('Skipping vendorPerformanceHistory wipe:', error);
  }

  try {
    await wipe('vendorDocument', () => prisma.vendorDocument.deleteMany({}));
  } catch (error) {
    console.warn('Skipping vendorDocument wipe:', error);
  }

  try {
    await wipe('vendorProduct', () => prisma.vendorProduct.deleteMany({}));
  } catch (error) {
    console.warn('Skipping vendorProduct wipe:', error);
  }

  await wipe('vendor', () => prisma.vendor.deleteMany({}));

  console.table(summary);
}

main()
  .catch((error) => {
    console.error('Failed to clean demo data:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
