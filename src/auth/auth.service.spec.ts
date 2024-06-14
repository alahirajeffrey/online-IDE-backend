import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.client';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const createdAt = Date.now();
  const updatedAt = Date.now();
  const id = randomUUID();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register user service', () => {
    const dto = {
      email: 'alahirajeffrey@gmail.com',
      password: 'P@ssw0rd',
      role: Role.DEVELOPER,
      profileImage: '',
      name: 'alahira jeffrey',
    };

    it('should throw an error if user already exists', async () => {
      prismaService.user.findFirst = jest.fn().mockResolvedValue(dto);

      expect(service.registerUser(dto)).rejects.toThrow(
        new HttpException('user already exists', HttpStatus.UNAUTHORIZED),
      );
    });

    it('should register a new user', async () => {
      prismaService.user.findFirst = jest.fn().mockResolvedValue(null);
      prismaService.user.create = jest.fn().mockResolvedValue({
        id: id,
        email: 'alahirajeffrey@gmail.com',
        password: 'P@ssw0rd',
        role: Role.DEVELOPER,
        profileImage: '',
        name: 'alahira jeffrey',
        createdAt: createdAt,
        updatedAt: updatedAt,
      });

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');

      const result = await service.registerUser(dto);

      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        data: {
          id: id,
          email: 'alahirajeffrey@gmail.com',
          password: 'P@ssw0rd',
          role: Role.DEVELOPER,
          profileImage: '',
          name: 'alahira jeffrey',
          createdAt: createdAt,
          updatedAt: updatedAt,
        },
      });
    });
  });

  describe('login service', () => {
    const dto = {
      email: 'alahirajeffrey@gmail.com',
      password: 'P@ssw0rd',
    };

    it('should throw an error if a user does not exist', async () => {
      prismaService.user.findFirst = jest.fn().mockResolvedValue(null);

      expect(service.login(dto)).rejects.toThrow(
        new HttpException('user does not exists', HttpStatus.NOT_FOUND),
      );
    });

    it('should throw an error is password is incorrect', async () => {
      prismaService.user.findFirst = jest.fn().mockResolvedValue({
        id: id,
        email: dto.email,
        password: 'hashedPassword',
        role: Role.DEVELOPER,
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(service.login(dto)).rejects.toThrow(
        new HttpException('incorrect password', HttpStatus.UNAUTHORIZED),
      );
    });

    it('should login a user and return an access token', async () => {
      prismaService.user.findFirst = jest.fn().mockResolvedValue({
        id: id,
        email: dto.email,
        password: dto.password,
        role: Role.DEVELOPER,
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jwtService.signAsync = jest.fn().mockResolvedValue('token');

      const result = await service.login(dto);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        data: { accessToken: 'token' },
      });
    });
  });

  describe('change password service', () => {
    const dto = {
      oldPassword: 'oldPassword',
      newPassword: 'newPassword',
    };
    const email = 'alahirajeffrey@gmail.com';

    it('should change the password of a user', async () => {
      prismaService.user.findFirst = jest.fn().mockResolvedValue({
        email: email,
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('newHashedPassword');
      prismaService.user.update = jest.fn().mockResolvedValue({});

      const result = await service.changePassword(dto, email);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'password changed successful',
      });
    });

    it('should throw an error if the old password is incorrect', async () => {
      prismaService.user.findFirst = jest.fn().mockResolvedValue({
        email: email,
        password: 'oldHashedPassword',
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(service.changePassword(dto, email)).rejects.toThrow(
        new HttpException('incorrect password', HttpStatus.UNAUTHORIZED),
      );
    });
  });

  describe('update user service', () => {
    it('should update user profile', async () => {
      const dto = {
        name: 'jeffrey alahira',
        profilePicture: 'www.profile-image.com',
      };
      const email = 'alahirajeffrey@gmail.com';

      prismaService.user.update = jest.fn().mockResolvedValue({});

      const result = await service.updateUser(dto, email);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'user profile updated',
      });
    });
  });

  describe('register admin service', () => {
    const dto = {
      email: 'jeffreyalahira@gmail.com.com',
      password: 'password',
      name: 'admin user',
    };
    const email = 'alahirajeffrey@gmail.com';

    it('should register an admin', async () => {
      prismaService.user.findFirst = jest.fn().mockResolvedValue({
        email: email,
        role: Role.ADMIN,
      });

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');

      prismaService.user.create = jest.fn().mockResolvedValue({
        id: id,
        email: dto.email,
        role: Role.ADMIN,
        profileImage: '',
        name: 'admin user',
        createdAt: createdAt,
        updatedAt: updatedAt,
      });

      const result = await service.registerAdmin(dto, email);

      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        data: {
          id: id,
          email: dto.email,
          role: Role.ADMIN,
          profileImage: '',
          name: 'admin user',
          createdAt: createdAt,
          updatedAt: updatedAt,
        },
      });
    });

    it('should throw an error if the user is not an admin', async () => {
      prismaService.user.findFirst = jest.fn().mockResolvedValue({
        email: email,
        role: Role.DEVELOPER,
      });

      await expect(service.registerAdmin(dto, email)).rejects.toThrow(
        new HttpException(
          'only an admin can add another admin',
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });
  });
});
