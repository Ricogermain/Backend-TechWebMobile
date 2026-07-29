import {
  Body, ClassSerializerInterceptor, Controller, Delete, Get,
  NotFoundException, Param, ParseIntPipe, Patch, Post, Query, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersDto } from './dto/find-users.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SelfOrAdminGuard } from '../auth/guards/self-or-admin.guard';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @Public()
    @ApiOperation({ summary: "Inscription d'un utilisateur (rôle CLIENT par défaut)" })
    @ApiBody({
      type: CreateUserDto,
      examples: {
        exemple: {
          summary: 'Inscription client',
          value: { nom: 'Rico', email: 'rico@example.com', motDePasse: 'password123', telephone: '0341234567' },
        },
      },
    })
    @ApiResponse({ status: 201, description: 'Utilisateur créé' })
    @ApiResponse({ status: 409, description: 'Email déjà utilisé' })
    create(@Body() dto: CreateUserDto) {
      return this.usersService.create(dto);
    }

    @Get()
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Lister tous les utilisateurs - ADMIN uniquement' })
    @ApiResponse({ status: 403, description: 'Accès réservé à ADMIN' })
    findAll(@Query() query: FindUsersDto) {
      return this.usersService.findAll(query.role);
    }

    @Get('recherche')
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Recherche par nom, email ou téléphone - ADMIN uniquement' })
    @ApiQuery({ name: 'q', required: false, example: 'rico' })
    @ApiResponse({ status: 403, description: 'Accès réservé à ADMIN' })
    recherche(@Query() query: SearchUsersDto) {
      return this.usersService.recherche(query.q);
    }

    @Get('email/:email')
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Trouver un utilisateur par email - ADMIN uniquement' })
    @ApiParam({ name: 'email', example: 'rico@example.com' })
    @ApiResponse({ status: 403, description: 'Accès réservé à ADMIN' })
    @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
    async findEmail(@Param('email') email: string) {
      const user = await this.usersService.findEmail(email);
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }
      return user;
    }

    @Get(':id')
    @ApiBearerAuth()
    @UseGuards(SelfOrAdminGuard)
    @ApiOperation({ summary: 'Consulter un profil - soi-même ou ADMIN' })
    @ApiParam({ name: 'id', example: 1 })
    @ApiResponse({ status: 403, description: "Réservé au propriétaire ou à l'ADMIN" })
    @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
    async findOne(@Param('id', ParseIntPipe) id: number) {
      const user = await this.usersService.findOne(id);
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }
      return user;
    }

    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(SelfOrAdminGuard)
    @ApiOperation({ summary: 'Modifier un profil (nom, email, téléphone) - soi-même ou ADMIN' })
    @ApiParam({ name: 'id', example: 1 })
    @ApiBody({
      type: UpdateUserDto,
      examples: {
        exemple: { summary: 'Mise à jour du profil', value: { nom: 'lateste', email: 'latest@gmail.com', telephone: '0321234500' } },
      },
    })
    @ApiResponse({ status: 403, description: "Réservé au propriétaire ou à l'ADMIN" })
    @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
    @ApiResponse({ status: 409, description: 'Email déjà utilisé par un autre utilisateur' })
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
      return this.usersService.update(id, dto);
    }

    @Patch(':id/role')
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: "Changer le rôle d'un utilisateur - ADMIN uniquement" })
    @ApiParam({ name: 'id', example: 3 })
    @ApiBody({ type: UpdateUserRoleDto, examples: { exemple: { value: { role: 'LIVREUR' } } } })
    @ApiResponse({ status: 403, description: 'Accès réservé à ADMIN' })
    @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
    updateRole(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserRoleDto) {
      return this.usersService.updateRole(id, dto.role);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Supprimer un utilisateur - ADMIN uniquement' })
    @ApiParam({ name: 'id', example: 1 })
    @ApiResponse({ status: 200, description: 'Utilisateur supprimé' })
    @ApiResponse({ status: 403, description: 'Accès réservé à ADMIN' })
    @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
    async remove(@Param('id', ParseIntPipe) id: number) {
      const user = await this.usersService.remove(id);
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }
      return user;
    }
}