import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { JwtGuard } from './guards/jwt.guard';

@ApiTags('auth-endpoints')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a recruiter or developer' })
  registerUser(@Body() dto: RegisterUserDto) {
    return this.authService.registerUser(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'login a user' })
  loginUser(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtGuard)
  @ApiSecurity('JWT-auth')
  @Patch('change-password')
  @ApiOperation({ summary: 'changer user password' })
  changePassword(@Body() dto: ChangePasswordDto, @Req() req) {
    return this.authService.changePassword(dto, req.user.email);
  }

  @UseGuards(JwtGuard)
  @ApiSecurity('JWT-auth')
  @Post('/admin/register')
  @ApiOperation({ summary: 'Register an admin' })
  registerAdmin(@Body() dto: RegisterAdminDto, @Req() req) {
    return this.authService.registerAdmin(dto, req.user.email);
  }
}
