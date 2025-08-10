import { Controller, Get, Put, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put('profile')
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.id, updateUserDto);
  }

  @Put(':id/deactivate')
  async deactivateUser(@Param('id') id: string) {
    await this.usersService.deactivateUser(id);
    return { message: 'User deactivated successfully' };
  }

  @Put(':id/activate')
  async activateUser(@Param('id') id: string) {
    await this.usersService.activateUser(id);
    return { message: 'User activated successfully' };
  }
}
