import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/client';
import { successResponse } from '../../common/utils/response';
import { AppError } from '../../common/middleware/errorHandler';

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: { include: { images: true, store: { select: { name: true } } } } },
        },
      },
    });
    if (!cart) {
      return res.json(successResponse({ items: [], subtotal: 0 }));
    }
    const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    res.json(successResponse({ ...cart, subtotal }));
  } catch (err) {
    next(err);
  }
};

export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity } = req.body;
    const userId = (req as any).user.userId;
    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    const item = await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity: quantity || 1 },
      update: { quantity: { increment: quantity || 1 } },
    });
    res.json(successResponse(item));
  } catch (err) {
    next(err);
  }
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity } = req.body;
    const userId = (req as any).user.userId;
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new AppError('NOT_FOUND', 'السلة غير موجودة', 404);
    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { cartId_productId: { cartId: cart.id, productId } } });
      return res.json(successResponse({ message: 'تم الحذف' }));
    }
    const item = await prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity },
    });
    res.json(successResponse(item));
  } catch (err) {
    next(err);
  }
};

export const removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.body;
    const userId = (req as any).user.userId;
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new AppError('NOT_FOUND', 'السلة غير موجودة', 404);
    await prisma.cartItem.delete({ where: { cartId_productId: { cartId: cart.id, productId } } });
    res.json(successResponse({ message: 'تم الحذف' }));
  } catch (err) {
    next(err);
  }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    res.json(successResponse({ message: 'تم تفريغ السلة' }));
  } catch (err) {
    next(err);
  }
};