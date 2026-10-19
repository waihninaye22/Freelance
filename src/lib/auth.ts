import jwt from "jsonwebtoken";

export function issueAccessToken(user: { id: string; isAdmin: boolean }) {
  return jwt.sign(
    { isAdmin: user.isAdmin },
    process.env.JWT_ACCESS_SECRET!,
    { subject: user.id, expiresIn: (process.env.JWT_ACCESS_TTL ?? "15m") as jwt.SignOptions["expiresIn"] },
  );
}

export function publicUser<T extends { passwordHash: string }>(user: T) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}
