import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/user.model';
import { IUser, AppError, ErrorCodes } from '../types';

// In-memory JTI blocklist — process restart clears it; use Redis in production
const jtiBlocklist = new Set<string>();

interface TokenPayload {
  id: string;
  email: string;
  jti: string;
  refresh_jti: string;
}

interface RefreshPayload {
  id: string;
  jti: string;
}

class AuthService {
  private get accessSecret(): string {
    return process.env.JWT_SECRET || 'dev-secret-change-me';
  }

  private get refreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';
  }

  private get accessExpires(): string {
    return process.env.JWT_ACCESS_EXPIRES || '15m';
  }

  private get refreshExpires(): string {
    return process.env.JWT_REFRESH_EXPIRES || '7d';
  }

  private get bcryptRounds(): number {
    return parseInt(process.env.JWT_BCRYPT_ROUNDS || '12', 10);
  }

  generateTokens(userId: string, email: string): { accessToken: string; refreshToken: string } {
    const accessJti = uuidv4();
    const refreshJti = uuidv4();

    const accessToken = jwt.sign(
      { id: userId, email, jti: accessJti, refresh_jti: refreshJti } as TokenPayload,
      this.accessSecret,
      { expiresIn: this.accessExpires } as jwt.SignOptions,
    );

    const refreshToken = jwt.sign(
      { id: userId, jti: refreshJti } as RefreshPayload,
      this.refreshSecret,
      { expiresIn: this.refreshExpires } as jwt.SignOptions,
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.accessSecret) as TokenPayload;
    } catch {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid or expired token');
    }
  }

  verifyRefreshToken(token: string): RefreshPayload {
    try {
      return jwt.verify(token, this.refreshSecret) as RefreshPayload;
    } catch {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid or expired refresh token');
    }
  }

  async register(email: string, password: string): Promise<IUser> {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new AppError(409, ErrorCodes.CONFLICT, 'Email already in use');
    }

    const hash = await bcrypt.hash(password, this.bcryptRounds);
    const user = await User.create({ email, password: hash });
    return user;
  }

  async login(email: string, password: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      // Constant-time comparison to prevent timing attacks
      await bcrypt.hash(password, this.bcryptRounds);
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError(401, ErrorCodes.UNAUTHORIZED, 'Invalid credentials');
    }

    const { accessToken, refreshToken } = this.generateTokens(user._id.toString(), user.email);
    return { user, accessToken, refreshToken };
  }

  logout(jti: string, refreshJti: string): void {
    jtiBlocklist.add(jti);
    jtiBlocklist.add(refreshJti);
  }

  isBlocked(jti: string): boolean {
    return jtiBlocklist.has(jti);
  }

  async getUserById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }
}

export default new AuthService();
