import { serviceUrls, authConfig } from '../config';

export interface ExternalRideInfo {
  rideId: string;
  passengerId: string;
  driverId?: string;
  actualDistanceKm?: number;
  status?: string;
}

export interface PaymentNotificationPayload {
  rideId: string;
  paymentId: string;
  amount: number;
  paymentMethod: string;
  status: 'SUCCESS' | 'FAILED';
  transactionReference: string;
}

/**
 * Client for RESTful interservice communication with Ride Management Service (Member 3).
 * Uses stable identifiers (rideId, passengerId) and communicates over HTTP with
 * the shared inter-service secret key (X-Internal-Service-Key).
 */
export class RideServiceClient {
  private baseUrl: string;
  private internalKey: string;

  constructor() {
    this.baseUrl = serviceUrls.rideService;
    this.internalKey = authConfig.internalServiceKey;
  }

  /**
   * Interaction 1: Fetch ride details and actual distance from Ride Management Service
   * to compute final fare accurately.
   * If the service is unreachable (standalone dev mode), returns a fallback or null.
   */
  async getRideDetails(rideId: string): Promise<ExternalRideInfo | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/rides/${rideId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': this.internalKey,
        },
      });

      if (!response.ok) {
        console.warn(`[Interservice] Ride service returned status ${response.status} for ride ${rideId}`);
        return null;
      }

      const data = (await response.json()) as any;
      return {
        rideId,
        passengerId: data.data?.passengerId || data.passengerId,
        driverId: data.data?.driverId || data.driverId,
        actualDistanceKm: data.data?.distanceKm || data.distanceKm,
        status: data.data?.status || data.status,
      };
    } catch (error: any) {
      console.warn(`[Interservice] Unable to connect to Ride Management Service at ${this.baseUrl}: ${error.message}`);
      return null;
    }
  }

  /**
   * Interaction 2: Notify Ride Management Service that payment has been successfully completed
   * so the ride state can transition to 'COMPLETED' / 'PAID'.
   */
  async notifyPaymentCompleted(payload: PaymentNotificationPayload): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/rides/${payload.rideId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': this.internalKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn(`[Interservice] Failed to notify ride service. Status: ${response.status}`);
        return false;
      }

      return true;
    } catch (error: any) {
      console.warn(`[Interservice] Ride service unreachable for payment notification: ${error.message}`);
      // In standalone mode, graceful degradation ensures payment is still committed locally
      return false;
    }
  }
}

export const rideServiceClient = new RideServiceClient();
