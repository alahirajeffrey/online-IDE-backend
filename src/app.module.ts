import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { UploadController } from './upload/upload.controller';
import { UploadModule } from './upload/upload.module';
import { UploadService } from './upload/upload.service';
import { PrismaService } from './prisma.client';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ProblemsModule } from './problems/problems.module';
import { winstonConfig } from './logger';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    CloudinaryModule,
    UploadModule,
    // setup rate limiting. only 20 requests allowed per minute per client
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),
    ProblemsModule,
    winstonConfig,
  ],
  controllers: [UploadController],
  providers: [
    UploadService,
    PrismaService,
    // bind rate limiter guard to entire API
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
