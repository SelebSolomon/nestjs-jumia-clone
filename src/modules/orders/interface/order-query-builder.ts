export interface OrderQuery {
  page?: number;
  limit?: number;
  sort?: string;
  paymentStatus?: string;
  shippingStatus?: string;
}
