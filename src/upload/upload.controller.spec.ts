import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { HttpStatus } from '@nestjs/common';

describe('UploadController', () => {
  let controller: UploadController;

  const mockUploadService = {
    uploadProfilePicture: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should upload a profile picture', async () => {
    const file: Express.Multer.File = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1000,
      destination: './uploads',
      filename: 'test.jpg',
      path: './uploads/test.jpg',
      buffer: Buffer.from('test'),
      stream: null,
    };
    const result = {
      statusCode: HttpStatus.CREATED,
      data: { url: 'http://profile-pic.com/test.jpg' },
    };
    mockUploadService.uploadProfilePicture.mockResolvedValue(result);

    expect(await controller.uploadProfilePicture(file)).toEqual(result);
    expect(mockUploadService.uploadProfilePicture).toHaveBeenCalledWith(file);
  });
});
