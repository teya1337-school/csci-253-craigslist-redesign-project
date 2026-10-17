export interface AuthenticatedUser {
  id: string;
  pictureVersion: string | null;
  privateEmail: string;
  username: string;
  privatePhoneNumber: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE';
}
