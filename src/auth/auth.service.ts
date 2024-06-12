import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma.client';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcryptjs';
import { ApiResponse } from 'src/types/response.type';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
// import { InjectLogger } from 'nest-winston';
// @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private config: ConfigService,
    private jwtService: JwtService,
    // @InjectLogger() private readonly logger: LoggerService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * register a new developer or recruiter
   * @param dto : register user dto with name, email, profilePicture, password, role
   * @returns : response code and new user details excluding hashed password
   */
  async registerUser(dto: RegisterUserDto): Promise<ApiResponse> {
    try {
      // check if user with email exists
      const userExists = await this.prismaService.user.findFirst({
        where: { email: dto.email },
      });

      if (userExists) {
        throw new HttpException('user already exists', HttpStatus.UNAUTHORIZED);
      }

      // hash password if user does not exist
      const hashedPassword = await bcrypt.hash(dto.password, 12);

      // save user to db
      const newUser = await this.prismaService.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          role: dto.role,
          profileImage: dto.profileImage,
          name: dto.name,
        },
        select: {
          id: true,
          email: true,
          role: true,
          profileImage: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return { statusCode: HttpStatus.CREATED, data: newUser };
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * login a user
   * @param dto : login user dto with email and password
   * @returns : response code and access token
   */
  async login(dto: LoginDto): Promise<ApiResponse> {
    try {
      // check to see if user exists
      const userExists = await this.prismaService.user.findFirst({
        where: { email: dto.email },
      });

      if (!userExists) {
        throw new HttpException('user does not exists', HttpStatus.NOT_FOUND);
      }

      // check is password is correct
      const passwordMatches = await bcrypt.compare(
        dto.password,
        userExists.password,
      );

      if (!passwordMatches) {
        throw new HttpException('incorrect password', HttpStatus.UNAUTHORIZED);
      }

      // create payload to sign token with
      const payload = {
        userId: userExists.id,
        email: userExists.email,
        role: userExists.role,
      };

      // sign access token
      const accessToken = await this.jwtService.signAsync(payload, {
        expiresIn: this.config.get('JWT_EXPIRES_IN'),
        secret: this.config.get('JWT_ACCESS_SECRET'),
      });

      return { statusCode: HttpStatus.OK, data: { accessToken: accessToken } };
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * change password
   * @param dto : change password dto with old and new password
   * @param email : user email
   * @returns : status code and message
   */
  async changePassword(
    dto: ChangePasswordDto,
    email: string,
  ): Promise<ApiResponse> {
    try {
      // check to see if user exists
      const user = await this.prismaService.user.findFirst({
        where: { email: email },
      });

      // check if old password is correct
      const isPasswordCorrect = await bcrypt.compare(
        dto.oldPassword,
        user.password,
      );

      if (!isPasswordCorrect) {
        throw new HttpException('incorrect password', HttpStatus.UNAUTHORIZED);
      }

      // hash new password and update password
      const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);
      await this.prismaService.user.update({
        where: { email: email },
        data: { password: newPasswordHash },
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'password changed successful',
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
   * register an admin user
   * @param dto : register admin dto with email, name and password
   * @param email : old admin email
   * @returns : status code and new admin details
   */
  async registerAdmin(
    dto: RegisterAdminDto,
    email: string,
  ): Promise<ApiResponse> {
    try {
      // check to see if user exists
      const user = await this.prismaService.user.findFirst({
        where: { email: email },
      });

      // ensure only admins can create other admins
      if (user.role !== 'ADMIN') {
        throw new HttpException(
          'only an admin can add another admin',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // hash password
      const passwordHash = await bcrypt.hash(dto.password, 12);

      // create admin
      const newAdmin = await this.prismaService.user.create({
        data: {
          name: dto.name,
          password: passwordHash,
          role: 'ADMIN',
          email: dto.email,
          profileImage: '', // use empty string as profile pic as admin can update details later and add profile picture
        },
        select: {
          id: true,
          email: true,
          role: true,
          profileImage: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return { statusCode: HttpStatus.CREATED, data: newAdmin };
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateUser(dto: UpdateUserDto, email: string): Promise<ApiResponse> {
    try {
      await this.prismaService.user.update({
        where: { email: email },
        data: { name: dto.name, profileImage: dto.profilePicture },
      });

      return { statusCode: HttpStatus.OK, message: 'user profile updated' };
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
