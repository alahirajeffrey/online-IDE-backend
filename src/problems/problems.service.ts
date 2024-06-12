import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.client';
import { CreateProblemDto } from './dto/create-problem.dto';
import { ApiResponse } from 'src/types/response.type';
import { UpdateProblemDto } from './dto/update-problem.dto';

@Injectable()
export class ProblemsService {
  constructor(private prismaService: PrismaService) {}

  private async checkIfUserIsAdmin(email: string) {
    try {
      const user = await this.prismaService.user.findFirst({
        where: { email: email },
      });

      if (user.role !== 'ADMIN') {
        throw new HttpException(
          'only admins can do that',
          HttpStatus.UNAUTHORIZED,
        );
      }

      return;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createProblem(
    dto: CreateProblemDto,
    email: string,
  ): Promise<ApiResponse> {
    try {
      // call function to check if user is admin
      await this.checkIfUserIsAdmin(email);

      // create new problem
      const newProblem = await this.prismaService.problem.create({
        data: {
          title: dto.title,
          description: dto.description,
          expectedOutput: dto.expectedOutput,
          input: dto.input,
        },
      });

      return { statusCode: HttpStatus.CREATED, data: newProblem };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getProblemById(problemId: string): Promise<ApiResponse> {
    try {
      const problem = await this.prismaService.problem.findFirst({
        where: { id: problemId },
      });

      return { statusCode: HttpStatus.OK, data: problem };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllProblems(): Promise<ApiResponse> {
    const problems = await this.prismaService.problem.findMany({});

    return { statusCode: HttpStatus.OK, data: problems };
  }

  async updateProblem(
    problemId: string,
    dto: UpdateProblemDto,
    email: string,
  ): Promise<ApiResponse> {
    try {
      // call function to check if user is admin
      await this.checkIfUserIsAdmin(email);

      // todo: paginate response
      // cache problems

      const updatedProblem = await this.prismaService.problem.update({
        where: { id: problemId },
        data: {
          title: dto.title,
          description: dto.description,
          expectedOutput: dto.expectedOutput,
          input: dto.input,
        },
      });

      return { statusCode: HttpStatus.OK, data: updatedProblem };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
