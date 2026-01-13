import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from './schema/order-schema';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from '../carts/schema/cart.schema';
import { ProductDocument } from '../products/schema/product.schema';
import { CreateOrderDto } from './dto/create-order-dto';
import { OrderQuery } from './interface/order-query-builder';
import { PaymentStatus } from './enums/payment-status-enum';
import { ShippingStatus } from './enums/shipping-status-enum';
import { UpdateOrderDto } from './dto/update-order-dto';
import { ProductsService } from '../products/products.service';
import { UpdateShippingStatusDto } from './dto/update-shipping-status-dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class OrdersService {
  logger = new Logger(OrdersService.name);
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    private productService: ProductsService,
    private userservice: UsersService,
  ) {}

  async findOrder(orderId: string, userId: string) {
    return this.orderModel.findOne({
      _id: orderId,
      user: userId,
      isActive: true,
    });
  }

  async findById(id: string) {
    return this.orderModel.findById(id);
  }

  async findAllOrders(query: OrderQuery) {
    const {
      page = 1,
      paymentStatus,
      limit = 20,
      sort = '-createdAt',
      shippingStatus,
    } = query;

    let filter: any = {};

    if (shippingStatus) {
      filter.shippingStatus = shippingStatus;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    let skip = (page - 1) * limit;

    const orders = await this.orderModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    return orders;
  }

  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const userObject = new Types.ObjectId(userId);
    // const order = await this.orderModel.find({ user: userObject });

    const cart = await this.cartModel
      .findOne({ user: userObject })
      .populate('items.product');

    if (!cart || cart.items.length < 0) {
      this.logger.error('Cart is empty');
      throw new NotFoundException('Cart Is Empty');
    }

    const productSnapshot = cart.items.map((item) => {
      const product = item.product as unknown as ProductDocument; // now TS knows fields exist
      return {
        product: product._id,
        nameSnapshot: product.name,
        imageSnapshot: product.thumbnail,
        price: item.priceSnapshot,
        quantity: item.quantity,
      };
    });

    const totalPrice = cart.totalPrice;

    const order = await this.orderModel.create({
      user: userId,
      products: productSnapshot,
      totalPrice,
      paymentMethod: createOrderDto.paymentMethod,
      shippingAddress: createOrderDto.shippingAddress,
    });

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    return {
      status: 'success',
      message: 'order is created successfully',
      data: {
        order,
      },
    };
  }

  async getOrder(userId: string, query: OrderQuery) {
    // const userObjectId = new Types.ObjectId(userId);

    //  Extract query params with defaults
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      paymentStatus,
      shippingStatus,
    } = query;

    //  Base filter (SECURITY CRITICAL)
    const filter: any = {
      user: userId,
      isActive: true,
    };

    //  Optional filters
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (shippingStatus) {
      filter.shippingStatus = shippingStatus;
    }

    //  Pagination
    const skip = (page - 1) * limit;

    //  Query orders
    const orders = await this.orderModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('products totalPrice paymentStatus shippingStatus createdAt')
      .lean();

    //  Total count (for frontend pagination)
    const total = await this.orderModel.countDocuments(filter);

    // Empty state (NOT an error)
    return {
      status: 'success',
      results: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders,
    };
  }

  async getSingleOrder(orderId: string, userId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      this.logger.error('invalid mongodb id');
      throw new BadRequestException('invalid id');
    }

    const order = await this.orderModel
      .findOne({
        _id: orderId,
        user: userId,
        isActive: true,
      })
      .select('products totalPrice paymentStatus shippingAddress createdAt');

    if (!order) {
      this.logger.error('trying to get order that doesnt belong to them');
      throw new NotFoundException('This order does not belong to you');
    }

    return {
      status: 'success',
      data: {
        order: {
          id: order._id,
          products: order.products,
          totalPrice: order.totalPrice,
          paymentStatus: order.paymentStatus,
          shippingAddress: order.shippingAddress,
        },
      },
    };
  }

  async cancelOrder(
    orderId: string,
    userId: string,
    updateOrderDto: UpdateOrderDto,
  ) {
    // 1️⃣ Validate MongoDB ID (Bad Request, not NotFound)
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order id');
    }

    // 2️⃣ Fetch order WITH ownership check (security-critical)
    const order = await this.orderModel.findOne({
      _id: orderId,
      user: userId,
      isActive: true,
    });

    if (!order) {
      // Do NOT reveal whether the order exists for another user
      this.logger.error('Order not found or does not belong to user');
      throw new NotFoundException('Order not found');
    }

    //  Cannot cancel a PAID order
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Order cannot be canceled because it has been paid for',
      );
    }

    //  Cannot cancel once shipping has started
    if (
      order.shippingStatus === ShippingStatus.SHIPPED ||
      order.shippingStatus === ShippingStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Order cannot be canceled because shipping has started',
      );
    }

    //  Only PENDING orders can be canceled
    if (order.shippingStatus !== ShippingStatus.PENDING) {
      throw new BadRequestException('Order cannot be canceled');
    }

    //  Restore product stock for each item
    for (const item of order.products) {
      await this.productService.increaseStock(item.product, item.quantity);
    }
    // Soft cancel order
    order.isActive = false;
    order.shippingStatus = ShippingStatus.CANCELED;
    order.canceledAt = new Date();
    order.canceledReason = updateOrderDto.canceledReason;

    // Save changes
    await order.save();

    // 7 Response
    return {
      status: 'success',
      message: 'Order successfully canceled',
      data: {
        order: {
          id: order._id,
          shippingStatus: order.shippingStatus,
          paymentStatus: order.paymentStatus,
          cancelreason: order.canceledReason,
        },
      },
    };
  }

  async adminUpdateStatus(
    orderId: string,
    userId: string, // can be used to check admin role
    updateShippingStatus: UpdateShippingStatusDto,
  ) {
    // 1️⃣ Validate MongoDB ID
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order ID');
    }

    // 2️⃣ Check if user is admin
    const isAdmin = await this.userservice.isAdmin(userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can perform this action');
    }

    // 3️⃣ Validate request body
    if (!updateShippingStatus || !updateShippingStatus.shippingStatus) {
      throw new BadRequestException('shippingStatus is required');
    }

    const { shippingStatus } = updateShippingStatus;

    if (!Object.values(ShippingStatus).includes(shippingStatus)) {
      throw new BadRequestException(
        `Invalid shippingStatus. Allowed: ${Object.values(ShippingStatus).join(', ')}`,
      );
    }

    // 4️⃣ Fetch the order
    const order = await this.orderModel.findOne({
      _id: orderId,
      isActive: true,
    });

    if (!order) {
      this.logger.error(`No active order found with ID ${orderId}`);
      throw new NotFoundException('Order not found');
    }

    // 5️⃣ Prevent invalid transitions
    if (
      order.shippingStatus === ShippingStatus.DELIVERED ||
      order.shippingStatus === ShippingStatus.CANCELED
    ) {
      throw new BadRequestException(
        `Cannot update order. Current status: ${order.shippingStatus}`,
      );
    }

    // 6️⃣ Prevent shipping if no products exist
    if (
      (shippingStatus === ShippingStatus.SHIPPED ||
        shippingStatus === ShippingStatus.DELIVERED) &&
      (!order.products || order.products.length === 0)
    ) {
      throw new BadRequestException(
        'Cannot ship or deliver an order with no products',
      );
    }

    // 7️⃣ Update shipping status
    order.shippingStatus = shippingStatus;

    // 8️⃣ Update timestamps based on status
    if (shippingStatus === ShippingStatus.SHIPPED) {
      order.shippedAt = new Date();
    } else if (shippingStatus === ShippingStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }

    // 9️⃣ Save changes (updatedAt handled automatically)
    await order.save();

    // 🔟 Return response
    return {
      status: 'success',
      message: `Order shipping status updated to ${shippingStatus}`,
      data: {
        order: {
          id: order._id,
          shippingStatus: order.shippingStatus,
          shippedAt: order.shippedAt,
          deliveredAt: order.deliveredAt,
        },
      },
    };
  }
}
