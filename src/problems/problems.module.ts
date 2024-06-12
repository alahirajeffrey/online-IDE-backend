import { Module } from '@nestjs/common';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.client';

@Module({
  controllers: [ProblemsController],
  providers: [ProblemsService, PrismaService],
  imports: [JwtModule.register({})],
})
export class ProblemsModule {}
