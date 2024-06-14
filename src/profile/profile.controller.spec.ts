import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { randomUUID } from 'crypto';

describe('ProfileController', () => {
  let controller: ProfileController;

  const email = 'alahirajeffrey@gmail.com';
  const userId = randomUUID();

  const mockProfileService = {
    getOwnProfileAndStatistics: jest.fn(),
    getUserProfileAndStatistics: jest.fn(),
  };

  const mockJwtGuard = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = { email, userId };
      return true;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
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

    controller = module.get<ProfileController>(ProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get own profile along with statistics', async () => {
    const result = { id: userId, name: 'alahira jeffrey', statistics: {} };
    mockProfileService.getOwnProfileAndStatistics.mockResolvedValue(result);

    expect(
      await controller.getOwnProfileAndStatistics({ user: { userId } }),
    ).toEqual(result);
    expect(mockProfileService.getOwnProfileAndStatistics).toHaveBeenCalledWith(
      userId,
    );
  });

  it('should get other user profile along with statistics', async () => {
    const result = { email, name: 'alahira jeffrey', statistics: {} };
    mockProfileService.getUserProfileAndStatistics.mockResolvedValue(result);

    expect(await controller.getUserProfileAndStatistics(email)).toEqual(result);
    expect(mockProfileService.getUserProfileAndStatistics).toHaveBeenCalledWith(
      email,
    );
  });
});
