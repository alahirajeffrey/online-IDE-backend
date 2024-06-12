import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma.client';
import { ApiResponse } from 'src/types/response.type';

@Injectable()
export class UploadService {
  constructor(
    private prismaService: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  /**
   * upload a file to cloudinary using helper function and save details to db
   * @param file : file to be uploaded
   * @returns : status code and data of saved profile picture
   */
  async uploadProfilePicture(file: Express.Multer.File): Promise<ApiResponse> {
    try {
      // check to see if file is an image
      if (file.mimetype !== 'image/jpeg' && file.mimetype !== 'image/png') {
        throw new HttpException('incorrect file type', HttpStatus.BAD_REQUEST);
      }

      // upload file to cloudinary
      const uploadedProfilePicture =
        await this.cloudinaryService.imageUploadHelper(file);

      // save uploaded file details to db
      const profilePictureDetails =
        await this.prismaService.profilePicture.create({
          data: { url: uploadedProfilePicture.url },
        });

      return { statusCode: HttpStatus.CREATED, data: profilePictureDetails };
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
