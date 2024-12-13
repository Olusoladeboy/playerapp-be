import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { DynamooseModule } from 'nestjs-dynamoose';
import { UserSchema } from './user.schema';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    DynamooseModule.forFeature([
      {
        name: 'User',
        schema: UserSchema,
        options: {
          tableName: 'user_table',
        },
      },
    ]),
  ],
})
export class UserModule {}
