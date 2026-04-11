import bcrypt from 'bcrypt';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(data: { password: string; hash: string }) {
  const { password, hash } = data;
  return bcrypt.compare(password, hash);
}
