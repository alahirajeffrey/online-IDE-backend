import { Test, TestingModule } from '@nestjs/testing';
import { ProblemsService } from './problems.service';
import { PrismaService } from '../prisma.client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';

describe('ProblemsService', () => {
  let service: ProblemsService;
  let prismaService: PrismaService;

  const email = 'alahirajeffrey@gmail.com';
  const id = randomUUID();
  const secondId = randomUUID();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProblemsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
            },
            problem: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
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

    service = module.get<ProblemsService>(ProblemsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check if user is an admin', () => {
    it('should throw an error if the user is not an admin', async () => {
      prismaService.user.findFirst = jest
        .fn()
        .mockResolvedValue({ role: Role.DEVELOPER });
      await expect(service['checkIfUserIsAdmin'](email)).rejects.toThrow(
        new HttpException('only admins can do that', HttpStatus.UNAUTHORIZED),
      );
    });

    it('should not throw an error if the user is an admin', async () => {
      prismaService.user.findFirst = jest
        .fn()
        .mockResolvedValue({ role: Role.ADMIN });
      await expect(
        service['checkIfUserIsAdmin'](email),
      ).resolves.toBeUndefined();
    });
  });

  describe('create problem', () => {
    it('should create a coding problem if user is admin', async () => {
      prismaService.user.findFirst = jest
        .fn()
        .mockResolvedValue({ role: 'ADMIN' });

      const createProblemDto: CreateProblemDto = {
        title: 'Test problem',
        description: 'This is just a test problem',
        expectedOutput: 'Test output',
        input: 'Test input',
      };

      prismaService.problem.create = jest
        .fn()
        .mockResolvedValue(createProblemDto);

      const result = await service.createProblem(createProblemDto, email);
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        data: createProblemDto,
      });
    });
  });

  describe('get problem by id', () => {
    it('should return a problem by id', async () => {
      const problem = {
        id: id,
        title: 'Test problem',
        description: 'This is just a test problem',
        expectedOutput: 'Test output',
        input: 'Test input',
      };
      prismaService.problem.findFirst = jest.fn().mockResolvedValue(problem);

      const result = await service.getProblemById(id);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        data: problem,
      });
    });
  });

  describe('get all problems', () => {
    it('should return paginated problems', async () => {
      const problems = [
        {
          id: id,
          title: 'first problem',
          description: 'description of first problem',
        },
        {
          id: secondId,
          title: 'second problem',
          description: 'description of first problem',
        },
      ];
      prismaService.problem.findMany = jest.fn().mockResolvedValue(problems);
      prismaService.problem.count = jest.fn().mockResolvedValue(2);

      const result = await service.getAllProblems(1, 2);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        data: {
          problems,
          pagination: {
            totalItems: 2,
            currentPage: 1,
            itemsPerPage: 2,
            totalPages: 1,
          },
        },
      });
    });
  });

  describe('update problems', () => {
    it('should update a problem if user is admin', async () => {
      prismaService.user.findFirst = jest
        .fn()
        .mockResolvedValue({ role: Role.ADMIN });
      const updateProblemDto: UpdateProblemDto = {
        title: 'updated title',
        description: 'Updated problem description',
        expectedOutput: 'Updated expected output',
        input: 'Updated input',
      };

      prismaService.problem.update = jest
        .fn()
        .mockResolvedValue(updateProblemDto);

      const result = await service.updateProblem(id, updateProblemDto, email);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        data: updateProblemDto,
      });
    });
  });
});
