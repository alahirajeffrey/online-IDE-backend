import { Module } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import { PrismaService } from 'src/prisma.client';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  providers: [SubmissionsService, PrismaService, ConfigService],
  controllers: [SubmissionsController],
  imports: [JwtModule.register({})],
})
export class SubmissionsModule {}
