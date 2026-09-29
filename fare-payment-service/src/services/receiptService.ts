import { prisma } from '../database/prisma';
import { AppError } from '../utils/AppError';

export class ReceiptService {
  /**
   * Get a receipt by its ID.
   */
  async getReceiptById(id: string) {
    const receipt = await prisma.receipt.findUnique({ where: { id } });
    if (!receipt) {
      throw new AppError('Receipt not found.', 404, 'RECEIPT_NOT_FOUND');
    }
    return receipt;
  }

  /**
   * Get the receipt associated with a ride.
   */
  async getReceiptByRideId(rideId: string) {
    const receipt = await prisma.receipt.findFirst({ where: { rideId } });
    if (!receipt) {
      throw new AppError('Receipt not found for this ride.', 404, 'RECEIPT_NOT_FOUND');
    }
    return receipt;
  }
}
