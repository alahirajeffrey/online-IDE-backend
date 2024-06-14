import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionsService } from './submissions.service';
import { PrismaService } from '../prisma.client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';

jest.mock('axios');

describe('SubmissionsService', () => {
  let service: SubmissionsService;
  let prismaService: PrismaService;

  let axiosMock: jest.Mocked<typeof axios>;

  const problemId = randomUUID();
  const userId = randomUUID();
  const email = 'alahirajeffrey@gmail.com';
  const submissionId = randomUUID();
  const secondSubmissionId = randomUUID();

  beforeEach(async () => {
    axiosMock = axios as jest.Mocked<typeof axios>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
            },
            problem: {
              findFirst: jest.fn(),
            },
            submission: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('fake-rapid-api-key'),
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

    service = module.get<SubmissionsService>(SubmissionsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create submission to problem', () => {
    it('should create a submission if user is a developer', async () => {
      prismaService.user.findFirst = jest
        .fn()
        .mockResolvedValue({ role: Role.DEVELOPER });
      prismaService.problem.findFirst = jest.fn().mockResolvedValue({
        input: '',
        expectedOutput: 'hello world',
      });

      axiosMock.request.mockResolvedValueOnce({
        data: { token: 'test-token' },
      });
      axiosMock.request.mockResolvedValueOnce({ data: { status: { id: 3 } } });

      const createSubmissionDto: CreateSubmissionDto = {
        problemId: problemId,
        sourceCode: 'print("hello world")',
        languageId: 1,
      };

      prismaService.submission.create = jest.fn().mockResolvedValue({
        sourceCode: 'print("hello world")',
        languageId: 1,
        result: 'PASSED',
        user: { connect: { id: userId } },
        problem: { connect: { id: problemId } },
        submissionToken: 'test-token',
      });

      const result = await service.createSubmission(
        createSubmissionDto,
        userId,
      );
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        data: expect.objectContaining({
          sourceCode: 'print("hello world")',
          languageId: 1,
          result: 'PASSED',
        }),
      });
    });

    it('should throw an error if user is not a developer', async () => {
      prismaService.user.findFirst = jest
        .fn()
        .mockResolvedValue({ role: Role.RECRUITER });

      const createSubmissionDto: CreateSubmissionDto = {
        problemId: problemId,
        sourceCode: 'print("hello world")',
        languageId: 1,
      };

      await expect(
        service.createSubmission(createSubmissionDto, userId),
      ).rejects.toThrow(
        new HttpException(
          'only developers can make submissions',
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });
  });

  describe('get own submissions for a problem', () => {
    it('should return own submissions for a problem', async () => {
      const ownSubmissions = [{ result: 'PASSED' }, { result: 'FAILED' }];
      prismaService.submission.findMany = jest
        .fn()
        .mockResolvedValue(ownSubmissions);

      const result = await service.getOwnubmissionsForProblem(
        problemId,
        userId,
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        data: {
          submissions: ownSubmissions,
          numberOfAttempts: 2,
          isSuccessful: true,
        },
      });
    });
  });

  describe('get users submission', () => {
    it("should return a user's submission for a particular problem", async () => {
      const userSubmissions = [{ result: 'PASSED' }, { result: 'FAILED' }];
      prismaService.submission.findMany = jest
        .fn()
        .mockResolvedValue(userSubmissions);

      const result = await service.getUsersSubmission(problemId, email);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        data: {
          submissions: userSubmissions,
          numberOfAttempts: 2,
          isSuccessful: true,
        },
      });
    });
  });

  describe('get all submissions for a problem', () => {
    it('should return paginated submissions for a problem', async () => {
      const submissions = [
        { id: submissionId, result: 'PASSED', problem: {} },
        { id: secondSubmissionId, result: 'FAILED', problem: {} },
      ];
      prismaService.submission.findMany = jest
        .fn()
        .mockResolvedValue(submissions);
      prismaService.submission.count = jest.fn().mockResolvedValue(2);

      const result = await service.getAllSubmissionsForAProblem(
        problemId,
        1,
        2,
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        data: {
          submissions,
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
});
