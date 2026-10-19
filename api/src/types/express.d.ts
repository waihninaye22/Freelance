declare global {
  namespace Express {
    interface Request {
      authUser?: { id: string; isAdmin: boolean };
    }
  }
}

export {};
