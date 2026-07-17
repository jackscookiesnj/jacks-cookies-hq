export type CustomerType = "wholesale" | "individual";
export type OrderStatus = "open" | "closed";
export type PaymentStatus = "paid" | "unpaid";
export type CookieSize = "2oz" | "3oz";

export type Customer = {
  id: string;
  type: CustomerType;
  name: string;
  code: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Order = {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_type: CustomerType;
  invoice_reference: string;
  delivery_date: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  cookie_size: CookieSize;
  cookie_count: number;
  price_per_cookie: number;
  cost_per_cookie: number;
  revenue: number;
  dough_prepped: boolean;
  dough_prep: string | null;
  bake_list: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderWithCustomer = Order & {
  customer?: Pick<
    Customer,
    "id" | "name" | "code" | "type" | "contact_name" | "email" | "phone" | "address"
  > | null;
};

export type ProductionCalendarDay = {
  date: string;
  dough_day: boolean;
  bake_day: boolean;
  shopping_day: boolean;
  packaging_day: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  par_level: number;
  location: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
