import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';

@ApiTags('profile-endpoints')
@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @UseGuards(JwtGuard)
  @ApiSecurity('JWT-auth')
  @Get('own')
  @ApiOperation({ summary: 'get own profile along with statistics' })
  getOwnProfileAndStatistics(@Req() req) {
    return this.profileService.getOwnProfileAndStatistics(req.user.userId);
  }

  @UseGuards(JwtGuard)
  @ApiSecurity('JWT-auth')
  @Get('other')
  @ApiOperation({ summary: 'get other user profile along with statistics' })
  getUserProfileAndStatistics(@Query('email') email: string) {
    return this.profileService.getUserProfileAndStatistics(email);
  }
}
