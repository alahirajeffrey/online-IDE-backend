import { Test, TestingModule } from '@nestjs/testing';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PaginationDto } from './dto/pagination.dto';

describe('Problems Controller', () => {
  let controller: ProblemsController;

  const problemId = randomUUID();

  const mockProblemsService = {
    createProblem: jest.fn(),
    getProblemById: jest.fn(),
    getAllProblems: jest.fn(),
    updateProblem: jest.fn(),
  };

  const mockGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProblemsController],
      providers: [
        {
          provide: ProblemsService,
          useValue: mockProblemsService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<ProblemsController>(ProblemsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create problem route', () => {
    it('should create a problem', async () => {
      const dto: CreateProblemDto = {
        title: 'test problem',
        description: 'test description',
        expectedOutput: 'hello world',
        input: '',
      };
      const req = { user: { email: 'alahirajeffrey@gmail.com' } };
      mockProblemsService.createProblem.mockResolvedValue({
        statusCode: HttpStatus.CREATED,
      });

      const result = await controller.createProblem(dto, req);

      expect(result).toEqual({ statusCode: HttpStatus.CREATED });
      expect(mockProblemsService.createProblem).toHaveBeenCalledWith(
        dto,
        req.user.email,
      );
    });
  });

  describe('get problem by Id route', () => {
    it('should return a problem by id', async () => {
      mockProblemsService.getProblemById.mockResolvedValue({
        statusCode: HttpStatus.OK,
      });

      const result = await controller.getProblemById(problemId);

      expect(result).toEqual({ statusCode: HttpStatus.OK });
      expect(mockProblemsService.getProblemById).toHaveBeenCalledWith(
        problemId,
      );
    });
  });

  describe('get all problems route', () => {
    it('should return all problems', async () => {
      const paginationDto: PaginationDto = { page: 1, pageSize: 2 };
      mockProblemsService.getAllProblems.mockResolvedValue({
        statusCode: HttpStatus.OK,
      });

      const result = await controller.getAllProblems(paginationDto);

      expect(result).toEqual({ statusCode: HttpStatus.OK });

      expect(mockProblemsService.getAllProblems).toHaveBeenCalledWith(
        paginationDto,
      );
    });
  });

  describe('update problem route', () => {
    it('should update a problem', async () => {
      const dto: UpdateProblemDto = {
        title: 'test problem',
        description: 'test description',
        expectedOutput: 'hello world',
        input: '',
      };
      const req = { user: { email: 'alahirajeffrey@gmail.com' } };
      mockProblemsService.updateProblem.mockResolvedValue({
        statusCode: HttpStatus.OK,
      });

      const result = await controller.updateProblem(problemId, dto, req);

      expect(result).toEqual({ statusCode: HttpStatus.OK });
      expect(mockProblemsService.updateProblem).toHaveBeenCalledWith(
        problemId,
        dto,
        req.user.email,
      );
    });
  });
});
