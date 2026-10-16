export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  phoneNumber: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE';
}
