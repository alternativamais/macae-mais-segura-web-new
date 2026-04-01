export interface Empresa {
  id: number;
  nome: string;
  cnpj?: string | null;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}
