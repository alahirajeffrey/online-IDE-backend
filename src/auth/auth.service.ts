import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma.client';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcryptjs';
import { ApiResponse } from 'src/types/response.type';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private config: ConfigService,
    private jwtService: JwtService,
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
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async changePassword(dto: ChangePasswordDto) {
    try {
      console.log(dto);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async registerAdmin(dto: RegisterAdminDto) {
    try {
      console.log(dto);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
