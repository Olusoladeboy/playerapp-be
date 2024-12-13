import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateFeedDto } from './dto/create-feed.dto';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { CloudFrontClient } from '@aws-sdk/client-cloudfront';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { User } from 'src/user/user.interface';
import { convertScanResponse } from 'src/utils';

// DTO for Video Metadata
export class VideoUploadDto {
  title: string;
  description?: string;
  id: string;
}

// Response DTO
export class VideoUploadResponseDto {
  videoId: string;
  originalFileName: string;
  cloudFrontUrl: string;
  uploadedAt: string;
}

@Injectable()
export class FeedService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;
  private readonly s3Client: S3Client;
  private readonly cloudFrontClient: CloudFrontClient;
  private readonly logger = new Logger(FeedService.name);

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
      },
    });

    this.cloudFrontClient = new CloudFrontClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
      },
    });

    const client = new DynamoDBClient({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
      },
      region: process.env.AWS_REGION || 'us-east-1',
    });

    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = process.env.DYNAMODB_FEED_TABLE;
  }

  // Generate a unique file path
  private generateUniqueFilePath(id: string, originalFileName: string): string {
    const fileExtension = originalFileName.split('.').pop();
    return `players/${id}/videos/${uuidv4()}.${fileExtension}`;
  }

  async create(
    file: Express.Multer.File,
    CreateFeedDto: CreateFeedDto,
    user: User,
  ) {
    const id = uuidv4();

    if (!file) throw new BadRequestException('Video File is required');

    const videoUploadResponse = await this.uploadVideo(file, {
      id,
      title: CreateFeedDto.caption,
    });

    const params = {
      TableName: this.tableName,
      Item: {
        id,
        ...CreateFeedDto,
        videoUrl: videoUploadResponse.cloudFrontUrl,
        profilePictureUrl: user.profilePicture,
        userId: user.id,
        userName: user.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    try {
      await this.docClient.send(new PutCommand(params));
      return params.Item;
    } catch (error) {
      throw new BadRequestException(`Failed to create feed: ${error.message}`);
    }
  }

  // Upload video to S3
  async uploadVideo(
    file: Express.Multer.File,
    metadata: VideoUploadDto,
  ): Promise<VideoUploadResponseDto> {
    // Validate file
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type (optional, adjust as needed)
    const allowedMimeTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only video files are allowed.',
      );
    }

    // Max file size check (e.g., 500MB)
    const maxFileSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxFileSize) {
      throw new BadRequestException('File size exceeds maximum limit of 500MB');
    }

    const uniqueFilePath = this.generateUniqueFilePath(
      metadata.id,
      file.originalname,
    );

    try {
      // Upload to S3
      const uploadParams: PutObjectCommandInput = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: uniqueFilePath,
        Body: file.buffer,
        ACL: 'public-read-write',
        ContentType: file.mimetype,
        Metadata: {
          id: metadata.id,
          title: metadata.title,
          uploadedAt: new Date().toISOString(),
        },
      };

      // Send upload command
      await this.s3Client.send(new PutObjectCommand(uploadParams));

      // Generate CloudFront URL
      const cloudFrontDomain = process.env.CLOUDFRONT_DOMAIN;
      const cloudFrontUrl = `https://${cloudFrontDomain}/${uniqueFilePath}`;

      // Return upload response
      return {
        videoId: uniqueFilePath,
        originalFileName: file.originalname,
        cloudFrontUrl: cloudFrontUrl,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Video upload failed', error);
      throw new InternalServerErrorException('Video upload failed');
    }
  }

  async listFeeds(limit = 10, lastEvaluatedKey = null) {
    const params: any = {
      TableName: this.tableName,
      Limit: Number(limit),
    };

    // Add pagination if last evaluated key is provided
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }

    try {
      const { Items, LastEvaluatedKey } = await this.docClient.send(
        new ScanCommand(params),
      );

      return {
        feeds: convertScanResponse(Items) || [],
        nextPage: LastEvaluatedKey || null,
      };
    } catch (error) {
      throw new Error(`Failed to list feeds: ${error.message}`);
    }
  }
}
