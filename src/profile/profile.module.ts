import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaService } from 'src/prisma.client';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, PrismaService],
  imports: [JwtModule.register({})],
})
export class ProfileModule {}
