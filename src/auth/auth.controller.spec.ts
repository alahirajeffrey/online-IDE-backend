import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtGuard } from './guards/jwt.guard';
import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;

  const email = 'alahirajeffrey@gmail.com';

  const mockAuthService = {
    registerUser: jest.fn(),
    login: jest.fn(),
    changePassword: jest.fn(),
    registerAdmin: jest.fn(),
    updateUser: jest.fn(),
  };

  const mockJwtGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = { email: 'test@example.com' };
      return true;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: Reflector,
          useValue: {},
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue(mockJwtGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register a user and return a 201 code', async () => {
    const dto: RegisterUserDto = {
      email: email,
      password: 'password',
      name: 'jeffrey alahira',
      profileImage: '',
      role: Role.DEVELOPER,
    };
    mockAuthService.registerUser.mockResolvedValue({
      statusCode: HttpStatus.CREATED,
    });

    expect(await controller.registerUser(dto)).toEqual({
      statusCode: HttpStatus.CREATED,
    });
    expect(mockAuthService.registerUser).toHaveBeenCalledWith(dto);
  });

  it('should login a user and return a 200', async () => {
    const dto: LoginDto = { email: email, password: 'password' };
    mockAuthService.login.mockResolvedValue({ statusCode: HttpStatus.OK });

    expect(await controller.loginUser(dto)).toEqual({
      statusCode: HttpStatus.OK,
    });
    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
  });

  it('should change password and return a 200', async () => {
    const dto: ChangePasswordDto = { oldPassword: 'old', newPassword: 'new' };
    mockAuthService.changePassword.mockResolvedValue({
      statusCode: HttpStatus.OK,
    });

    expect(
      await controller.changePassword(dto, {
        user: { email: email },
      }),
    ).toEqual({ statusCode: HttpStatus.OK });
    expect(mockAuthService.changePassword).toHaveBeenCalledWith(dto, email);
  });

  it('should register an admin', async () => {
    const dto: RegisterAdminDto = {
      email: email,
      name: 'jeffrey alahira',
      password: 'password',
    };
    mockAuthService.registerAdmin.mockResolvedValue({
      statusCode: HttpStatus.CREATED,
    });

    expect(
      await controller.registerAdmin(dto, {
        user: { email: email },
      }),
    ).toEqual({ statusCode: HttpStatus.CREATED });
    expect(mockAuthService.registerAdmin).toHaveBeenCalledWith(dto, email);
  });

  it('should update user', async () => {
    const dto: UpdateUserDto = { name: 'calvin jeffrey', profilePicture: '' };
    mockAuthService.updateUser.mockResolvedValue({ statusCode: HttpStatus.OK });

    expect(
      await controller.updateUser(dto, { user: { email: email } }),
    ).toEqual({ statusCode: HttpStatus.OK });
    expect(mockAuthService.updateUser).toHaveBeenCalledWith(dto, email);
  });
});
