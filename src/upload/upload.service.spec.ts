import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { PrismaService } from '../prisma.client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { HttpException, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';

describe('UploadService', () => {
  let service: UploadService;
  let prismaService: PrismaService;
  let cloudinaryService: CloudinaryService;
  //   let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: PrismaService,
          useValue: {
            profilePicture: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: CloudinaryService,
          useValue: {
            imageUploadHelper: jest.fn(),
          },
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    prismaService = module.get<PrismaService>(PrismaService);
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
    // logger = module.get<Logger>(WINSTON_MODULE_PROVIDER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload profile picture', () => {
    it('should upload a profile picture and save details to db', async () => {
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 1234,
        buffer: Buffer.from('test'),
        destination: '',
        filename: '',
        path: '',
        stream: null,
      };

      const uploadedProfilePicture = { url: 'http://cloudinary.com/test.png' };
      const profilePictureDetails = {
        id: randomUUID(),
        url: 'http://cloudinary.com/test.png',
      };

      cloudinaryService.imageUploadHelper = jest
        .fn()
        .mockResolvedValue(uploadedProfilePicture);
      prismaService.profilePicture.create = jest
        .fn()
        .mockResolvedValue(profilePictureDetails);

      const result = await service.uploadProfilePicture(file);

      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(result.data).toEqual(profilePictureDetails);
      expect(cloudinaryService.imageUploadHelper).toHaveBeenCalledWith(file);
      expect(prismaService.profilePicture.create).toHaveBeenCalledWith({
        data: { url: uploadedProfilePicture.url },
      });
    });

    it('should throw an error if file type is incorrect', async () => {
      const file: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 1234,
        buffer: Buffer.from('test'),
        destination: '',
        filename: '',
        path: '',
        stream: null,
      };

      await expect(service.uploadProfilePicture(file)).rejects.toThrow(
        HttpException,
      );
      await expect(service.uploadProfilePicture(file)).rejects.toThrow(
        new HttpException('incorrect file type', HttpStatus.BAD_REQUEST),
      );

      expect(cloudinaryService.imageUploadHelper).not.toHaveBeenCalled();
      expect(prismaService.profilePicture.create).not.toHaveBeenCalled();
    });
  });
});
