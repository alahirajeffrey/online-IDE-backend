import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { PrismaService } from '../prisma.client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
// import { Logger } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';

describe('profile service', () => {
  let service: ProfileService;
  let prismaService: PrismaService;
  //   let logger: Logger;
  const id = randomUUID();
  const createdAt = Date.now();
  //   const updatedAt = Date.now();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
            },
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

    service = module.get<ProfileService>(ProfileService);
    prismaService = module.get<PrismaService>(PrismaService);
    // logger = module.get<Logger>(WINSTON_MODULE_PROVIDER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get own profile and statistics', () => {
    it('should return profile and statistics for own profile', async () => {
      const userId = id;
      const user = {
        id: id,
        email: 'alahirajeffrey@gmail.com',
        role: Role.DEVELOPER,
        profileImage: '',
        createdAt: createdAt,
        submissions: [
          { result: 'PASSED' },
          { result: 'FAILED' },
          { result: 'PASSED' },
        ],
      };

      prismaService.user.findFirst = jest.fn().mockResolvedValue(user);

      const result = await service.getOwnProfileAndStatistics(userId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        data: {
          userId: user.id,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
          numberOfSubmissions: 3,
          percentageFailed: 33.33333333333333,
          percentagePassed: 66.66666666666667,
        },
      });
    });
  });

  describe('get user profile and statistics', () => {
    it('should return profile and statistics for another user', async () => {
      const email = 'alahirajeffrey@gmail.com';
      const user = {
        id: id,
        email: email,
        role: Role.DEVELOPER,
        profileImage: '',
        createdAt: createdAt,
        submissions: [
          { result: 'PASSED' },
          { result: 'FAILED' },
          { result: 'PASSED' },
        ],
      };

      prismaService.user.findFirst = jest.fn().mockResolvedValue(user);

      const result = await service.getUserProfileAndStatistics(email);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        data: {
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
          numberOfSubmissions: 3,
          percentageFailed: 33.33333333333333,
          percentagePassed: 66.66666666666667,
        },
      });
    });
  });
});
