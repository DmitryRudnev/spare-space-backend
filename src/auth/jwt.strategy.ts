import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/services/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userService: UsersService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    if (payload.type === '2fa' || payload.type === 'register') {
      throw new UnauthorizedException('Invalid token type');
    }

    const userId = parseInt(payload.sub, 10);
    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    await this.userService.validateExistence(userId);
    const roles = await this.userService.getUserRoles(userId);
    if (!roles?.length) {
      throw new UnauthorizedException('User has no assigned roles');
    }

    return { userId, roles };
  }
}
