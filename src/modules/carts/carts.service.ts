import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Cart, CartDocument } from './schema/cart.schema';
import { Model, Types } from 'mongoose';
import { ProductsService } from '../products/products.service';
import { UpdateCartDto } from './dto/update-cart.dto';

@Injectable()
export class CartsService {
  constructor(
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
    private productService: ProductsService,
  ) {}

  async addToCart(userId: string, dto: CreateCartDto) {
    //  Fetch products
    const products = await this.productService.getProductsByIds(
      dto.items!.map((i) => i.product),
    );

    if (!products.length) {
      return {
        status: 'fail',
        message: 'Some products are no longer available',
      };
    }

    // 2️⃣ Build valid items
    const validItems: {
      product: Types.ObjectId;
      quantity: number;
      priceSnapshot: number;
    }[] = [];

    for (const item of dto.items!) {
      const product = products.find(
        (p) => p._id.toString() === item.product.toString(),
      );
      if (!product) continue;

      validItems.push({
        product: product._id,
        quantity: Math.max(1, Math.min(Number(item.quantity), product.stock)),
        priceSnapshot: product.price,
      });
    }

    if (!validItems.length) {
      return {
        status: 'fail',
        message: 'No valid items to add',
      };
    }

    const userObjectId = new Types.ObjectId(userId);
    //  ATOMIC cart fetch-or-create (NO NULL POSSIBLE)
    const cart = await this.cartModel.findOneAndUpdate(
      { user: userObjectId },
      { $setOnInsert: { user: new Types.ObjectId(userId), items: [] } },
      { new: true, upsert: true },
    );

    //  Merge items safely
    for (const newItem of validItems) {
      const existingItem = cart.items.find(
        (i) => i.product.toString() === newItem.product.toString(),
      );

      if (existingItem) {
        existingItem.quantity += newItem.quantity;
        existingItem.priceSnapshot = newItem.priceSnapshot;
      } else {
        cart.items.push(newItem);
      }
    }

    await cart.save();
    return cart;
  }

  async getCart(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    // 1️⃣ Find cart (DO NOT create on GET)
    const cart = await this.cartModel.findOne({ user: userObjectId }).populate({
      path: 'items.product',
      select: 'name price stock isActive',
    });

    console.log('ssssssssssssssssssssssssssssssssssss', cart);
    // 2️⃣ If no cart → return empty cart
    if (!cart) {
      return {
        items: [],
        summary: {
          totalItems: 0,
          totalPrice: 0,
          hasIssues: false,
        },
      };
    }

    let totalItems = 0;
    let totalPrice = 0;
    let hasIssues = false;

    // 3️⃣ Normalize cart items
    const items = cart.items.map((item) => {
      const product: any = item.product;

      // Product deleted or inactive
      if (!product || product.isActive! === false) {
        hasIssues = true;
        return {
          product: null,
          quantity: item.quantity,
          priceSnapshot: item.priceSnapshot,
          available: false,
          reason: 'PRODUCT_UNAVAILABLE',
        };
      }

      // Stock checks
      let adjustmentRequired = false;

      if (product.stock < item.quantity) {
        hasIssues = true;
        adjustmentRequired = true;
      }

      // Price check (do NOT auto-update)
      if (product.price !== item.priceSnapshot) {
        hasIssues = true;
      }

      totalItems += item.quantity;
      totalPrice += item.quantity * item.priceSnapshot;

      return {
        product: {
          id: product._id,
          name: product.name,
          currentPrice: product.price,
          stock: product.stock,
        },
        quantity: item.quantity,
        priceSnapshot: item.priceSnapshot,
        available: product.stock > 0,
        adjustmentRequired,
        maxQuantity: product.stock,
      };
    });

    // 4️⃣ Return final cart (READ-ONLY)
    return {
      items,
      summary: {
        totalItems,
        totalPrice,
        hasIssues,
      },
    };
  }

  async updateCart(itemId: string, updateDto: UpdateCartDto, userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    //  Fetch user cart
    const cart = await this.cartModel
      .findOne({ user: userObjectId })
      .select('items totalPrice');

    if (!cart || cart.items.length === 0) {
      throw new NotFoundException('Cart is empty');
    }

    //  Find the cart item to update
    const cartItem = cart.items.find(
      (i) => i._id?.toString() === itemId.toString(),
    );

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    //  Fetch the product for validation
    const product = await this.productService.getProductById(
      cartItem.product.toString(),
    );

    if (!product || !product.isActive) {
      throw new BadRequestException('Product is no longer available');
    }

    if (product.stock === 0) {
      throw new BadRequestException('Product is out of stock');
    }

    //  Clamp quantity to available stock
    const requestedQty = Number(updateDto.quantity);
    if (requestedQty <= 0) {
      throw new BadRequestException('Quantity must be at least 1');
    }

    const finalQty = Math.min(requestedQty, product.stock);

    //  Update cart item
    cartItem.quantity = finalQty;
    cartItem.priceSnapshot = product.price; // optional: update snapshot to latest price

    //  Save cart
    await cart.save();

    //  Return updated item and warnings if any
    return {
      totalPrice: cart.totalPrice,
      item: {
        id: cart._id,
        product: {
          id: product._id,
          name: product.name,
          currentPrice: product.price,
          stock: product.stock,
        },
        quantity: cartItem.quantity,
        priceSnapshot: cartItem.priceSnapshot,
        maxQuantity: product.stock,
      },
      warning:
        requestedQty > product.stock
          ? `Quantity adjusted to available stock (${product.stock})`
          : null,
    };
  }

  async deleteAnItemFromTheCart(itemId: string, userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    const cart = await this.cartModel.findOne({ user: userObjectId });

    if (!cart || cart.items.length === 0) {
      throw new NotFoundException('Cart is empty');
    }

    const itemExists = cart.items.some((i) => i._id?.toString() === itemId);

    if (!itemExists) {
      throw new NotFoundException('Cart item not found');
    }

    cart.items = cart.items.filter((i) => i._id?.toString() !== itemId);
    await cart.save();

    return {
      status: 'success',
      message: 'Item removed from cart',
      totalPrice: cart.totalPrice,
      items: cart.items,
    };
  }

  async clearCartItems(userId: string) {
    const cart = await this.cartModel.findOne({ user: userId });

    if (!cart) {
      throw new NotFoundException('Cart not found or cart is empty');
    }

    cart.items = [];
    await cart.save();

    return {
      status: 'success',
      message: 'Cart cleared',
      totalPrice: cart.totalPrice,
      items: cart.items,
    };
  }
}
