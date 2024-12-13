import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  Put,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('/login')
  @UsePipes(new ValidationPipe())
  login(@Body() loginDto: LoginDto) {
    return this.userService.login(loginDto);
  }

  @UseGuards(AuthGuard)
  @Get('/profile')
  getProfile(@Request() req) {
    return this.userService.getUserById(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Put()
  @UsePipes(new ValidationPipe())
  update(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(req.user.id, updateUserDto);
  }
}
