import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersDto } from './dto/find-users.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: "Inscription d'un utilisateur (rôle CLIENT par défaut)" })
  @ApiBody({
  type: CreateUserDto,
  examples: {
    exemple: {
      summary: 'Inscription client',
      value: {
        nom: 'Rico',
        email: 'rico@example.com',
        motDePasse: 'password123',
        telephone: '0341234567',
      },
    },
  },
})
  @ApiResponse({ status: 201, description: 'Utilisateur créé' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les utilisateurs (filtrable par rôle)' })
  findAll(@Query() query: FindUsersDto) {
    return this.usersService.findAll(query.role);
  }

  @Get('recherche')
  @ApiOperation({ summary: 'Recherche par nom, email ou téléphone' })
  @ApiQuery({ name: 'q', required: false, example: 'rico' })
  recherche(@Query() query: SearchUsersDto) {
    return this.usersService.recherche(query.q);
  }

  @Get('email/:email')
  @ApiOperation({ summary: 'Trouver un utilisateur par email' })
  @ApiParam({ name: 'email', example: 'rico@example.com' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async findEmail(@Param('email') email: string) {
    const user = await this.usersService.findEmail(email);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return user;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Trouver un utilisateur par id' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return user;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier le profil (nom, email, téléphone)' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiBody({
    type: UpdateUserDto,
    examples: {
        exemple: {
        summary: 'Mise à jour du profil',
        value: {
            nom: 'lateste',
            email: 'latest@gmail.com',
            telephone: '0321234500',
        },
        },
    },
  })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  @ApiResponse({ status: 409, description: 'Email déjà utilisé par un autre utilisateur' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Utilisateur supprimé' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.remove(id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return user;
  }
}