import { OrderStatus } from '@prisma/client';
import { canTransitionOrderStatus } from '../src/common/utils/orderStateMachine';

const transitions: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['ACCEPTED_BY_MERCHANT', 'REJECTED_BY_MERCHANT', 'CANCELLED_BY_CUSTOMER'],
  ACCEPTED_BY_MERCHANT: ['PREPARING', 'REJECTED_BY_MERCHANT', 'CANCELLED_BY_CUSTOMER'],
  PREPARING: ['READY_FOR_PICKUP', 'REJECTED_BY_MERCHANT'],
  READY_FOR_PICKUP: ['ASSIGNED_TO_DRIVER', 'REJECTED_BY_MERCHANT'],
  ASSIGNED_TO_DRIVER: ['ON_THE_WAY', 'DELIVERY_FAILED'],
  ON_THE_WAY: ['DELIVERED', 'DELIVERY_FAILED'],
  DELIVERED: [],
  REJECTED_BY_MERCHANT: [],
  CANCELLED_BY_CUSTOMER: [],
  DELIVERY_FAILED: ['ASSIGNED_TO_DRIVER'],
};

describe('Order state machine', () => {
  it('accepts every configured transition', () => {
    for (const [current, nextStatuses] of Object.entries(transitions) as [OrderStatus, OrderStatus[]][]) {
      for (const next of nextStatuses) {
        expect(canTransitionOrderStatus(current, next)).toBe(true);
      }
    }
  });

  it('rejects every transition not explicitly configured', () => {
    const statuses = Object.values(OrderStatus);

    for (const current of statuses) {
      for (const next of statuses) {
        if (!transitions[current].includes(next)) {
          expect(canTransitionOrderStatus(current, next)).toBe(false);
        }
      }
    }
  });
});
