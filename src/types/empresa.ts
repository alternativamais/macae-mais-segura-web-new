export interface Empresa {
  id: number;
  nome: string;
  cnpj?: string | null;
  status: 'active' | 'inactive';
  logoUrl?: string | null;
  logoIconUrl?: string | null;
  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;
  logoSquareLightUrl?: string | null;
  logoSquareDarkUrl?: string | null;
  pointPinUrl?: string | null;
  totemPinUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
