import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.client';
import { CreateProblemDto } from './dto/create-problem.dto';
import { ApiResponse } from 'src/types/response.type';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class ProblemsService {
  constructor(
    private prismaService: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * helper function to check if user is admin
   * @param email : email of user
   * @returns status code and error message if user is not admin
   */
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
      this.logger.error(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * create a coding problem
   * @param dto : create problem dto with title, description, expected output and input fields
   * @param email : email of user creating problem
   * @returns : status code and problem details
   */
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
      this.logger.error(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * get problem details by id
   * @param problemId : id of problem
   * @returns : status code and problem details
   */
  async getProblemById(problemId: string): Promise<ApiResponse> {
    try {
      const problem = await this.prismaService.problem.findFirst({
        where: { id: problemId },
      });

      return { statusCode: HttpStatus.OK, data: problem };
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * get all problems with pagination
   * @param page - current page number
   * @param limit - number of items per page
   * @returns status code and list of available problems
   */
  async getAllProblems(dto: PaginationDto): Promise<ApiResponse> {
    try {
      // paginate result
      const offset = (dto.page - 1) * dto.pageSize;

      const problems = await this.prismaService.problem.findMany({
        skip: offset,
        take: dto.pageSize,
      });

      const totalProblems = await this.prismaService.problem.count();

      return {
        statusCode: HttpStatus.OK,
        data: {
          problems,
          pagination: {
            totalItems: totalProblems,
            currentPage: dto.page,
            itemsPerPage: dto.pageSize,
            totalPages: Math.ceil(totalProblems / dto.pageSize),
          },
        },
      };
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * update a problem
   * @param problemId : id of problem
   * @param dto : create problem dto with title, description, expected output and input fields
   * @param email : email of user
   * @returns: status code and object containing update problem
   */
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
      this.logger.error(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
