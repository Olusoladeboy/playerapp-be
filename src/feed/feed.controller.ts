import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Get,
  Query,
} from '@nestjs/common';
import { FeedService } from './feed.service';
import { CreateFeedDto } from './dto/create-feed.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @UseGuards(AuthGuard)
  @Post()
  @UsePipes(new ValidationPipe())
  @UseInterceptors(FileInterceptor('video'))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createFeedDto: CreateFeedDto,
    @Request() req,
  ) {
    return this.feedService.create(file, createFeedDto, req.user);
  }

  @UseGuards(AuthGuard)
  @Get()
  list(@Query('limit') limit: number, @Query('next') next: string) {
    return this.feedService.listFeeds(limit, next);
  }
}
