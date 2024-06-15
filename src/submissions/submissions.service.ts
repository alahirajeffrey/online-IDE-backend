import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from '../prisma.client';
import { ApiResponse } from '../types/response.type';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import axios from 'axios';
import { PaginationDto } from 'src/problems/dto/pagination.dto';
import { Problem } from '@prisma/client';

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

  /**
   * helper function to submit solution to coding problem to judge0
   * @param dto : create submission dto
   * @param problem : problem object
   * @returns :response from judge0
   */
  async submitToJudgeZero(dto: CreateSubmissionDto, problem: Problem) {
    try {
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

      console.log('Submission created:', createSubmissionRespone.data);

      // Add a delay before fetching the result
      await new Promise((resolve) => setTimeout(resolve, 3000)); // 5 seconds delay

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
      console.log('Submission created:', getSubmissionResponse.data);

      return { createSubmissionRespone, getSubmissionResponse };
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * submit a solution to a coding problem
   * @param dto : create submission dto with source code, language id and problem id fields
   * @param userId : id of user
   * @returns : http status code and submission object
   */
  async createSubmission(
    dto: CreateSubmissionDto,
    userId: string,
  ): Promise<ApiResponse> {
    try {
      // ensure only developers can make submissions to problems
      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
      });
      if (user.role !== 'DEVELOPER') {
        throw new HttpException(
          'only developers can make submissions',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // get details of the problem
      const problem = await this.prismaService.problem.findFirst({
        where: { id: dto.problemId },
        include: { submissions: { where: { userId: userId } } },
      });

      // loop through past solutions to see if user has solved it before
      let isProblemSolved: boolean;
      problem.submissions.map((submission) => {
        if (submission.result === 'PASSED') {
          isProblemSolved = true;
          return;
        }
      });

      // if user has solved it before, check if the solution is correct but dont save details to avoid spamming result statistics
      if (isProblemSolved === true) {
        const { getSubmissionResponse } = await this.submitToJudgeZero(
          dto,
          problem,
        );

        const result =
          getSubmissionResponse.data.status.id === 3 ? 'PASSED' : 'FAILED';

        return { statusCode: HttpStatus.OK, data: { result: result } };
      }

      // if user has not solved before, check solution and save result to db
      const { createSubmissionRespone, getSubmissionResponse } =
        await this.submitToJudgeZero(dto, problem);

      const submission = await this.prismaService.submission.create({
        data: {
          sourceCode: dto.sourceCode,
          languageId: dto.languageId,
          result:
            getSubmissionResponse.data.status.id === 3 ? 'PASSED' : 'FAILED',
          user: { connect: { id: userId } },
          problem: { connect: { id: dto.problemId } },
          submissionToken: createSubmissionRespone.data.token,
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
    dto: PaginationDto,
  ): Promise<ApiResponse> {
    try {
      // paginate result
      const offset = (dto.page - 1) * dto.pageSize;

      // return paginated submissions and the associated problem
      const submissions = await this.prismaService.submission.findMany({
        where: { problemId: problemId },
        include: {
          problem: true,
        },
        skip: offset,
        take: dto.pageSize,
      });

      const totalSubmissions = await this.prismaService.submission.count();

      return {
        statusCode: HttpStatus.OK,
        data: {
          submissions,
          pagination: {
            totalItems: totalSubmissions,
            currentPage: dto.page,
            itemsPerPage: dto.pageSize,
            totalPages: Math.ceil(totalSubmissions / dto.pageSize),
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
