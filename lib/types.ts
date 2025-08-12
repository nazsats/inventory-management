
export interface Container {
  id: string;
  supplier: string;
  containerCode: string;
  status: string;
  location?: string;
  arrivalDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  nomenclature: string;
  quantity: number;
  actualPrice: number;
  negotiablePrice: number;
  sellingPrice: number;
  containerId: string;
  imageUrl?: string;
  containerQuantity: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff';
  createdAt: Date;
  createdBy: string;
}
