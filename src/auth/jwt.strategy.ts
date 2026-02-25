import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/services/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    if (payload.type === '2fa') {
      throw new UnauthorizedException('Invalid token type');
    }
    const userId = parseInt(payload.sub, 10);
    if (!userId || isNaN(userId)) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roles = await this.userService.getUserRoles(userId);
    if (!roles || roles.length === 0) {
      throw new UnauthorizedException('User has no assigned roles');
    }

    return { userId, roles };
  }
}
