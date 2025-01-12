export interface User {
  id: string;
  email: string;
  password: string;
  company_name: string;
  address: string;
  postal_code: string;
  province: string;
  telephone: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  company_name: string;
  address: string;
  postal_code: string;
  province: string;
  telephone: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  company_name: string;
  address: string;
  postal_code: string;
  province: string;
  telephone: string;
  created_at: Date;
  updated_at: Date;
} 