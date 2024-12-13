import { Module } from '@nestjs/common';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { UserService } from 'src/user/user.service';

@Module({
  controllers: [FeedController],
  providers: [FeedService, UserService],
})
export class FeedModule {}
