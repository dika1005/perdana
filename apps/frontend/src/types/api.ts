export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
