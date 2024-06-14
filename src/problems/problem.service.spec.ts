import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service.ts';
import { PrismaService } from '../prisma.client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('ProfileService', () => {
  let service: ProfileService;
  let prismaService: PrismaService;
  let logger: Logger;

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
    logger = module.get<Logger>(WINSTON_MODULE_PROVIDER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOwnProfileAndStatistics', () => {
    it('should return profile and statistics for own profile', async () => {
      const userId = '1';
      const user = {
        id: '1',
        email: 'test@example.com',
        role: 'USER',
        profileImage: '',
        createdAt: new Date(),
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

    it('should throw an error if user not found', async () => {
      const userId = '1';

      prismaService.user.findFirst = jest.fn().mockResolvedValue(null);

      await expect(service.getOwnProfileAndStatistics(userId)).rejects.toThrow(
        new HttpException(
          "Cannot read properties of null (reading 'submissions')",
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('getUserProfileAndStatistics', () => {
    it('should return profile and statistics for another user', async () => {
      const email = 'test@example.com';
      const user = {
        id: '1',
        email: 'test@example.com',
        role: 'USER',
        profileImage: '',
        createdAt: new Date(),
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

    it('should throw an error if user not found', async () => {
      const email = 'test@example.com';

      prismaService.user.findFirst = jest.fn().mockResolvedValue(null);

      await expect(service.getUserProfileAndStatistics(email)).rejects.toThrow(
        new HttpException(
          "Cannot read properties of null (reading 'submissions')",
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
});
