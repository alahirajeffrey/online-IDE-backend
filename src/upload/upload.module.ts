import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { PrismaService } from 'src/prisma.client';

@Module({
  providers: [UploadService, PrismaService],
  controllers: [UploadController],
  imports: [CloudinaryModule],
})
export class UploadModule {}
