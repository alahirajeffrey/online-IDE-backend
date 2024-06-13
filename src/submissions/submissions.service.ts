import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/prisma.client';
import { ApiResponse } from 'src/types/response.type';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import axios from 'axios';

@Injectable()
export class SubmissionsService {
  private rapidApiKey: string;

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.rapidApiKey = this.configService.get<string>('RAPID_API_KEY');
  }

  async createSubmission(
    dto: CreateSubmissionDto,
    userId: string,
  ): Promise<ApiResponse> {
    try {
      const problem = await this.prismaService.problem.findFirst({
        where: { id: dto.problemId },
      });

      // make a post request to judge0 to create a submission on their platform
      const createSubmissionOptions = {
        method: 'POST',
        url: 'https://judge0-ce.p.rapidapi.com/submissions',
        params: { fields: '*' },
        headers: {
          'x-rapidapi-key': this.rapidApiKey,
          'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
        data: {
          language_id: dto.languageId,
          source_code: dto.sourceCode,
          stdin: problem.input,
          expected_output: problem.expectedOutput,
        },
      };

      const createSubmissionRespone = await axios.request(
        createSubmissionOptions,
      );

      // get submission token from the response and make get request to check result
      const getSubmissionOptions = {
        method: 'GET',
        url: `https://judge0-ce.p.rapidapi.com/submissions/${createSubmissionRespone.data.token}`,
        params: {
          base64_encoded: 'true',
          fields: '*',
        },
        headers: {
          'x-rapidapi-key': this.rapidApiKey,
          'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
        },
      };
      const getSubmissionResponse = await axios.request(getSubmissionOptions);

      // save result gotten from judge0 to db
      const submission = await this.prismaService.submission.create({
        data: {
          sourceCode: dto.sourceCode,
          languageId: dto.languageId,
          result:
            getSubmissionResponse.data.status.id === 3 ? 'PASSED' : 'FAILED',
          user: { connect: { id: userId } },
          problem: { connect: { id: dto.problemId } },
        },
      });
      return { statusCode: HttpStatus.CREATED, data: submission };
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * get own's list of submissions for a problem
   * @param userId : id of user
   * @param problemId : id of peoblem
   * @param dto : dto containing user email
   * @returns : status code with list of problems
   */
  async getOwnubmissionsForProblem(
    problemId: string,
    userId?: string,
  ): Promise<ApiResponse> {
    try {
      const ownSubmissions = await this.prismaService.submission.findMany({
        where: { userId: userId, problemId: problemId },
      });

      // number of attempts made
      const numberOfAttempts = ownSubmissions.length;

      // check if user has been successful at least once
      let isSuccessful;
      ownSubmissions.map((submission) => {
        if (submission.result === 'PASSED') {
          isSuccessful = true;
        }
        return;
      });

      return {
        statusCode: HttpStatus.OK,
        data: {
          submissions: ownSubmissions,
          numberOfAttempts: numberOfAttempts,
          isSuccessful: isSuccessful,
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
   * get a user's submission for a particular problem
   * @param problemId
   * @param email
   * @returns
   */
  async getUsersSubmission(
    problemId: string,
    email: string,
  ): Promise<ApiResponse> {
    try {
      console.log('here');
      const userSubmissions = await this.prismaService.submission.findMany({
        where: { problemId: problemId, user: { email: email } },
      });

      // calculate number of attempts made
      const numberOfAttempts = userSubmissions.length;

      // check if user has been successful at least once
      let isSuccessful;
      userSubmissions.map((submission) => {
        if (submission.result === 'PASSED') {
          isSuccessful = true;
        }
        return;
      });

      return {
        statusCode: HttpStatus.OK,
        data: {
          submissions: userSubmissions,
          numberOfAttempts: numberOfAttempts,
          isSuccessful: isSuccessful,
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
   * return a list of paginated submssions for a problem
   * @param problemId : id of the problem
   * @param page : current page number
   * @param limit : number of items per page
   * @returns : status code, paginated submissions and problem
   */
  async getAllSubmissionsForAProblem(
    problemId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<ApiResponse> {
    try {
      // paginate result
      const offset = (page - 1) * limit;

      // return paginated submissions and the associated problem
      const submissions = await this.prismaService.submission.findMany({
        where: { problemId: problemId },
        include: {
          problem: true,
        },
        skip: offset,
        take: limit,
      });

      const totalSubmissions = await this.prismaService.submission.count();

      return {
        statusCode: HttpStatus.OK,
        data: {
          submissions,
          pagination: {
            totalItems: totalSubmissions,
            currentPage: page,
            itemsPerPage: limit,
            totalPages: Math.ceil(totalSubmissions / limit),
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
}
