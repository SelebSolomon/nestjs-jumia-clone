# **0️⃣ Auth Module**

**Model (`auth.model.ts`)**
_(Fields can be added to `user.model.ts` if preferred)_

- `email`
- `password`
- `role` (`customer`, `seller`, `admin`)
- `isActive` (boolean)
- `passwordResetToken`
- `passwordResetExpires`
- `emailVerificationToken`
- `emailVerified` (boolean)
- `refreshToken` (optional if using refresh token strategy)

**Controller (`auth.controller.ts`) – Routes**

| Route                             | Method | Purpose                             |
| --------------------------------- | ------ | ----------------------------------- |
| `/api/auth/register`              | POST   | Register customer or seller         |
| `/api/auth/login`                 | POST   | Login user, return JWT              |
| `/api/auth/logout`                | POST   | Logout user, invalidate JWT         |
| `/api/auth/me`                    | GET    | Get current logged-in user          |
| `/api/auth/update-password`       | PATCH  | Change current password (old + new) |
| `/api/auth/forgot-password`       | POST   | Send reset password email           |
| `/api/auth/reset-password/:token` | PATCH  | Reset password using token          |
| `/api/auth/verify-email/:token`   | PATCH  | Verify email after registration     |
| `/api/auth/refresh-token`         | POST   | Issue new JWT using refresh token   |

**Service (`auth.service.ts`)**

Handles:

- Password hashing & validation
- JWT creation & verification
- Refresh tokens
- Forgot password token creation & email sending
- Password reset
- Email verification token creation & validation
- Logout (invalidate JWT or cookie)

---

# **1️⃣ Users Module**

**Model (`user.model.ts`)**

- `name`, `email`, `password`, `role` (`customer`, `admin`, `seller`), `address[]`, `phone`, `isActive`

**Controller (`users.controller.ts`) – Routes**

| Route                  | Method | Purpose                          |
| ---------------------- | ------ | -------------------------------- | ----------------------- |
| `/api/users`           | POST   | Admin: create user (optional)    |
| `/api/users/me`        | GET    | Get current user profile         |
| `/api/users/update-me` | PATCH  | Update current user profile      |
| `/api/users/delete-me` | DELETE | Soft delete current user account |
| `/api/users/:id`       | GET    | Admin: get user info             |
| `/api/users/:id`       | PATCH  | Admin: update user (role, etc.)  |
| `/api/users/:id/ban`   | PATCH  | Admin: ban a user                | // to do on admin route |
| `/api/users/:id/unba`  | PATCH  | Admin: ban a user                | // to do on admin route |

**Service:** `usersService` handles DB operations, password hashing, account management.

---

# **2️⃣ Categories Module**

**Model (`category.model.ts`)**: `name`, `description`, `image`

**Controller (`categories.controller.ts`)**

| Route                 | Method | Purpose                |
| --------------------- | ------ | ---------------------- |
| `/api/categories`     | GET    | List all categories    |
| `/api/categories/:id` | GET    | Get category details   |
| `/api/categories`     | POST   | Admin: create category |
| `/api/categories/:id` | PATCH  | Admin: update category |
| `/api/categories/:id` | DELETE | Admin: delete category |

---

# **3️⃣ Products Module**

**Model (`product.model.ts`)**: `name`, `description`, `price`, `images[]`, `stock`, `categoryId`, `sellerId`, `ratingAvg`, `reviews[]`

**Controller (`products.controller.ts`)**

| Route               | Method | Purpose                                  |
| ------------------- | ------ | ---------------------------------------- |
| `/api/products`     | GET    | List all products (filter/sort/paginate) |
| `/api/products/:id` | GET    | Product details                          |
| `/api/products`     | POST   | Seller/Admin: add product                |
| `/api/products/:id` | PATCH  | Admin: update product             |
| `/api/products/:id` | DELETE | Admin: remove product             |

**Extra:** search, filter by category, price range, seller.

---

# **4️⃣ Cart Module**

**Model (`cart.model.ts`)**: `userId`, `items[]` → `{ productId, quantity }`

**Controller (`cart.controller.ts`)**

| Route               | Method | Purpose                 |
| ------------------- | ------ | ----------------------- |
| `/api/cart`         | GET    | Get current user’s cart |
| `/api/cart`         | POST   | Add product to cart     |
| `/api/cart/:itemId` | PATCH  | Update item quantity    |
| `/api/cart/:itemId` | DELETE | Remove item from cart   |
| `/api/cart/clear`   | DELETE | Clear entire cart       |

---

# **5️⃣ Orders Module**

**Model (`order.model.ts`)**: `userId`, `items[]` → `{ productId, quantity, price }`, `total`, `status` (`pending`, `paid`, `shipped`, `delivered`, `cancelled`), `shippingAddress`, `paymentId`

**Controller (`orders.controller.ts`)**

| Route                    | Method | Purpose                       |
| ------------------------ | ------ | ----------------------------- |
| `/api/orders`            | GET    | List user’s orders            |
| `/api/orders/:id`        | GET    | Order details                 |
| `/api/orders`            | POST   | Create new order from cart    |
| `/api/orders/:id/cancel` | PATCH  | Cancel order                  |
| `/api/orders/:id/status` | PATCH  | Admin: update shipping status |

---

# **6️⃣ Payment Module**

**Model (`payment.model.ts`)**: `orderId`, `userId`, `amount`, `status` (`pending`, `completed`, `failed`), `paymentMethod`

**Controller (`payments.controller.ts`)**

| Route                      | Method | Purpose                       |
| -------------------------- | ------ | ----------------------------- |
| `/api/payments/pay`        | POST   | Pay for order (Stripe/PayPal) |
| `/api/payments/:id`        | GET    | Payment status                |
| `/api/payments/:id/refund` | PATCH  | Refund payment                |

---

# **7️⃣ Reviews Module**

**Model (`review.model.ts`)**: `userId`, `productId`, `rating`, `comment`, `createdAt`

**Controller (`reviews.controller.ts`)**

| Route                     | Method | Purpose                     |
| ------------------------- | ------ | --------------------------- |
| `/api/reviews`            | POST   | Leave review for product    |
| `/api/reviews/:productId` | GET    | Get all reviews for product |

---

# **8️⃣ Admin Module**

**Controller (`admin.controller.ts`)**

| Route                          | Method | Purpose             |
| ------------------------------ | ------ | ------------------- |
| `/api/admin/users`             | GET    | List all users      |
| `/api/admin/products`          | GET    | List all products   |
| `/api/admin/orders`            | GET    | List all orders     |
| `/api/admin/categories`        | GET    | List all categories |
| `/api/admin/ban-user/:id`      | PATCH  | Ban a user          |
| `/api/admin/verify-seller/:id` | PATCH  | Verify a seller     |

---

# **9️⃣ Security / Middleware**

- **AuthGuard** → Protect routes
- **RolesGuard** → `customer` vs `seller` vs `admin`
- **ValidationPipe** → DTO validation
- **Rate limiter + Sanitization** → Prevent abuse / injections

---

✅ This now includes the **Auth module fully integrated** with registration, login, logout, forgot/reset password, email verification, refresh tokens, and role-based access.

---
