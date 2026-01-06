const error = {
  // -------------------- Auth / Users --------------------
  validationError: {
    statusCode: 400,
    message: 'Validation failed',
    error: 'Bad Request',
    code: 'BAD_REQUEST',
  },
  unauthorized: {
    statusCode: 401,
    message: 'You are not authorized',
    error: 'Unauthorized',
    code: 'UNAUTHORIZED',
  },
  forbidden: {
    statusCode: 403,
    message: 'Access forbidden for this resource',
    error: 'Forbidden',
    code: 'FORBIDDEN',
  },
  userNotFound: {
    statusCode: 404,
    message: 'User not found',
    error: 'Not Found',
    code: 'USER_NOT_FOUND',
  },
  userAlreadyExists: {
    statusCode: 409,
    message: 'User with this email already exists',
    error: 'Conflict',
    code: 'USER_ALREADY_EXISTS',
  },
  invalidCredentials: {
    statusCode: 401,
    message: 'Invalid email or password',
    error: 'Unauthorized',
    code: 'INVALID_CREDENTIALS',
  },
  passwordMismatch: {
    statusCode: 400,
    message: 'Password and confirm password do not match',
    error: 'Bad Request',
    code: 'PASSWORD_MISMATCH',
  },

  // -------------------- Categories --------------------
  categoryNotFound: {
    statusCode: 404,
    message: 'Category not found',
    error: 'Not Found',
    code: 'CATEGORY_NOT_FOUND',
  },
  categoryAlreadyExists: {
    statusCode: 409,
    message: 'Category already exists',
    error: 'Conflict',
    code: 'CATEGORY_ALREADY_EXISTS',
  },

  // -------------------- Products --------------------
  productNotFound: {
    statusCode: 404,
    message: 'Product not found',
    error: 'Not Found',
    code: 'PRODUCT_NOT_FOUND',
  },
  productOutOfStock: {
    statusCode: 400,
    message: 'Product is out of stock',
    error: 'Bad Request',
    code: 'OUT_OF_STOCK',
  },
  productAlreadyExists: {
    statusCode: 409,
    message: 'Product already exists',
    error: 'Conflict',
    code: 'PRODUCT_ALREADY_EXISTS',
  },

  // -------------------- Cart --------------------
  cartNotFound: {
    statusCode: 404,
    message: 'Cart not found',
    error: 'Not Found',
    code: 'CART_NOT_FOUND',
  },
  cartEmpty: {
    statusCode: 400,
    message: 'Cart is empty',
    error: 'Bad Request',
    code: 'CART_EMPTY',
  },

  // -------------------- Orders --------------------
  orderNotFound: {
    statusCode: 404,
    message: 'Order not found',
    error: 'Not Found',
    code: 'ORDER_NOT_FOUND',
  },
  orderCannotBeCancelled: {
    statusCode: 400,
    message: 'Order cannot be cancelled at this stage',
    error: 'Bad Request',
    code: 'ORDER_CANNOT_CANCEL',
  },
  orderAlreadyPaid: {
    statusCode: 400,
    message: 'Order has already been paid',
    error: 'Bad Request',
    code: 'ORDER_ALREADY_PAID',
  },

  // -------------------- Payments --------------------
  paymentFailed: {
    statusCode: 400,
    message: 'Payment failed',
    error: 'Bad Request',
    code: 'PAYMENT_FAILED',
  },
  paymentNotFound: {
    statusCode: 404,
    message: 'Payment not found',
    error: 'Not Found',
    code: 'PAYMENT_NOT_FOUND',
  },
  refundFailed: {
    statusCode: 400,
    message: 'Refund failed',
    error: 'Bad Request',
    code: 'REFUND_FAILED',
  },

  // -------------------- Reviews --------------------
  reviewNotFound: {
    statusCode: 404,
    message: 'Review not found',
    error: 'Not Found',
    code: 'REVIEW_NOT_FOUND',
  },
  reviewAlreadyExists: {
    statusCode: 409,
    message: 'You have already reviewed this product',
    error: 'Conflict',
    code: 'REVIEW_ALREADY_EXISTS',
  },

  // -------------------- Admin --------------------
  adminActionForbidden: {
    statusCode: 403,
    message: 'You are not allowed to perform this admin action',
    error: 'Forbidden',
    code: 'ADMIN_ACTION_FORBIDDEN',
  },
  sellerNotVerified: {
    statusCode: 403,
    message: 'Seller is not verified',
    error: 'Forbidden',
    code: 'SELLER_NOT_VERIFIED',
  },

  // -------------------- General --------------------
  resourceNotFound: {
    statusCode: 404,
    message: 'Resource not found',
    error: 'Not Found',
    code: 'RESOURCE_NOT_FOUND',
  },
  serverError: {
    statusCode: 500,
    message: 'Internal server error',
    error: 'Server Error',
    code: 'INTERNAL_SERVER_ERROR',
  },
};

export default error;
