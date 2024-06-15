import { Test, TestingModule } from '@nestjs/testing';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { PaginationDto } from '../problems/dto/pagination.dto';
import { randomUUID } from 'crypto';
import { HttpStatus } from '@nestjs/common';

describe('SubmissionsController', () => {
  let controller: SubmissionsController;

  const problemId = randomUUID();
  const email = 'alahirajeffrey@gmail.com';

  const mockSubmissionsService = {
    getUsersSubmission: jest.fn(),
    createSubmission: jest.fn(),
    getAllSubmissionsForAProblem: jest.fn(),
    getOwnubmissionsForProblem: jest.fn(),
  };

  const mockGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionsController],
      providers: [
        {
          provide: SubmissionsService,
          useValue: mockSubmissionsService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<SubmissionsController>(SubmissionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('get users submission route', () => {
    it('should return submissions for a problem made by a user', async () => {
      mockSubmissionsService.getUsersSubmission.mockResolvedValue({
        statusCode: HttpStatus.OK,
      });

      const result = await controller.getUsersSubmission(problemId, email);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
      });
      expect(mockSubmissionsService.getUsersSubmission).toHaveBeenCalledWith(
        problemId,
        email,
      );
    });
  });

  describe('create submission route', () => {
    it('should create a submission for a problem', async () => {
      const dto: CreateSubmissionDto = {
        sourceCode: '',
        languageId: 10,
        problemId: problemId,
      };
      const req = { user: { userId: '123' } };
      mockSubmissionsService.createSubmission.mockResolvedValue({
        statusCode: HttpStatus.CREATED,
      });

      const result = await controller.createSubmission(dto, req);

      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
      });
      expect(mockSubmissionsService.createSubmission).toHaveBeenCalledWith(
        dto,
        req.user.userId,
      );
    });
  });

  describe('get all submissions for a problem route', () => {
    it('should return all submissions for a problem made by all users', async () => {
      const dto: PaginationDto = { page: 1, pageSize: 10 };
      mockSubmissionsService.getAllSubmissionsForAProblem.mockResolvedValue({
        statusCode: HttpStatus.OK,
      });

      const result = await controller.getAllSubmissionsForAProblem(
        problemId,
        dto,
      );

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
      });
      expect(
        mockSubmissionsService.getAllSubmissionsForAProblem,
      ).toHaveBeenCalledWith(problemId, dto);
    });
  });

  describe('get own submissions for problem route', () => {
    it('should return own submissions for a problem', async () => {
      const req = { user: { userId: '123' } };
      mockSubmissionsService.getOwnubmissionsForProblem.mockResolvedValue({
        statusCode: HttpStatus.OK,
      });

      const result = await controller.getOwnubmissionsForProblem(
        problemId,
        req,
      );

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
      });
      expect(
        mockSubmissionsService.getOwnubmissionsForProblem,
      ).toHaveBeenCalledWith(problemId, req.user.userId);
    });
  });
});
