import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Submission } from '@prisma/client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { PrismaService } from 'src/prisma.client';
import { ApiResponse } from 'src/types/response.type';

@Injectable()
export class ProfileService {
  constructor(
    private prismaService: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * helper function to calculate statistics
   * @param submissions : array of user submission
   * @returns : number of submissions, percentage passed and percentage failed
   */
  private calculateStatistics(submissions: Submission[]) {
    let numberOfSubmissionFailed;
    submissions.map((submission) => {
      if (submission.result === 'FAILED') {
        numberOfSubmissionFailed++;
      }
    });

    const percentageFailed =
      (numberOfSubmissionFailed / submissions.length) * 100;
    const percentagePassed = 100 - Number(percentageFailed);

    return {
      numberOfSubmissions: submissions.length,
      percentageFailed: percentageFailed,
      percentagePassed: percentagePassed,
    };
  }

  /**
   * get own profile along with submission statistics
   * @param userId : id of user
   * @returns : status code, profile and statistics
   */
  async getOwnProfileAndStatistics(userId: string): Promise<ApiResponse> {
    try {
      const user = await this.prismaService.user.findFirst({
        where: { id: userId },
        include: { submissions: true },
      });

      // call function to calculate statistics
      const { numberOfSubmissions, percentageFailed, percentagePassed } =
        this.calculateStatistics(user.submissions);

      return {
        statusCode: HttpStatus.OK,
        data: {
          userId: user.id,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
          numberOfSubmissions: numberOfSubmissions,
          percentageFailed: percentageFailed,
          percentagePassed: percentagePassed,
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
   * get another user's profile and statistics
   * @param email: email of user
   * @returns : status code, profile and statistics
   */
  async getUserProfileAndStatistics(email: string): Promise<ApiResponse> {
    try {
      const user = await this.prismaService.user.findFirst({
        where: { email: email },
        include: { submissions: true },
      });

      // call function to calculate statistics
      const { numberOfSubmissions, percentageFailed, percentagePassed } =
        this.calculateStatistics(user.submissions);

      return {
        statusCode: HttpStatus.OK,
        data: {
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          createdAt: user.createdAt,
          numberOfSubmissions: numberOfSubmissions,
          percentageFailed: percentageFailed,
          percentagePassed: percentagePassed,
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
