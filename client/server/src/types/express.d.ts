export interface RequestUser {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  roles?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
      tokenId?: string;
    }
  }
}

export {};
