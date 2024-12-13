import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(private jwtService: JwtService) {
    const client = new DynamoDBClient({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
      },
      region: process.env.AWS_REGION || 'us-east-1',
    });

    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = process.env.DYNAMODB_PLAYER_TABLE;
  }

  async hashPassword(password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  }

  async comparePassword(
    inputtedPassword: string,
    savedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(inputtedPassword, savedPassword);
  }

  async login(loginDto: LoginDto) {
    try {
      const { email, password } = loginDto;
      const user = await this.getUserByEmail(email);
      if (!user || !user.length) throw new NotFoundException('User not found');

      const isPasswordCorrect = await this.comparePassword(
        password,
        user[0].password,
      );

      if (!isPasswordCorrect) throw new UnauthorizedException('Invalid Login');

      const payload = {
        id: user[0].id,
        email,
        lastLoginAt: new Date().toISOString(),
      };
      const accessToken = await this.jwtService.signAsync(payload);
      return {
        accessToken,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async create(CreateUserDto: CreateUserDto) {
    const id = uuidv4();

    const params = {
      TableName: this.tableName,
      Item: {
        // playerapp_user: id,
        id,
        ...CreateUserDto,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    params.Item.password = await this.hashPassword(params.Item.password);

    try {
      await this.docClient.send(new PutCommand(params));
      return { id, ...CreateUserDto };
    } catch (error) {
      throw new BadRequestException(`Failed to create user: ${error.message}`);
    }
  }

  async getUserById(id: string) {
    const params = {
      TableName: this.tableName,
      Key: { id },
    };

    try {
      const { Item } = await this.docClient.send(new GetCommand(params));

      if (!Item) {
        throw new NotFoundException(`User not found`);
      }

      return Item;
    } catch (error) {
      throw new Error(`Failed to retrieve user: ${error.message}`);
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const updateExpression = Object.keys(updateUserDto)
      .map((key) => `${key} = :${key}`)
      .join(', ');

    const expressionAttributeValues = Object.keys(updateUserDto).reduce(
      (acc, key) => {
        acc[`:${key}`] = updateUserDto[key];
        return acc;
      },
      {},
    );

    const params = {
      TableName: this.tableName,
      Key: { id },
      UpdateExpression: `SET ${updateExpression}, updatedAt = :updatedAt`,
      ExpressionAttributeValues: {
        ...expressionAttributeValues,
        ':updatedAt': new Date().toISOString(),
      },
      ReturnValue: 'ALL_NEW',
    };

    try {
      await this.docClient.send(new UpdateCommand(params));
      return {
        success: true,
      };
    } catch (error) {
      throw new Error(`Failed to update player: ${error.message}`);
    }
  }

  async deleteUser(id: string) {
    const params = {
      TableName: this.tableName,
      Key: { id },
    };

    try {
      await this.docClient.send(new DeleteCommand(params));
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async getUserByEmail(email: string) {
    const params = {
      TableName: this.tableName,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    };

    try {
      const { Items } = await this.docClient.send(new QueryCommand(params));
      return Items || [];
    } catch (error) {
      throw new Error(`Failed to query users by club: ${error.message}`);
    }
  }

  async listUsers(limit = 10, lastEvaluatedKey = null) {
    const params: any = {
      TableName: this.tableName,
      Limit: limit,
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
        users: Items || [],
        nextPage: LastEvaluatedKey || null,
      };
    } catch (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }
  }
}
