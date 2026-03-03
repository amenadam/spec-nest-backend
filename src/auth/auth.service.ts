import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const { email, password, fullName } = dto;

    const isExist = await this.prisma.user.findUnique({
      where: { email },
    });

    if (isExist) {
      throw new ConflictException('User already registered!');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashed,
        fullName,
      },
    });

    return user;
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invlid Credentials');
    }

    const isMatched = await bcrypt.compare(dto.password, user.password);

    if (!isMatched) {
      throw new UnauthorizedException('Invlid Credentials');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };

    return { token: this.jwtService.sign(payload) };
  }
}
