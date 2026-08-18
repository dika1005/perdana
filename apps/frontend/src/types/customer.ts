export interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  created_at: string;
}

export interface CreateCustomerPayload {
  name: string;
  phone?: string;
  address?: string;
}
