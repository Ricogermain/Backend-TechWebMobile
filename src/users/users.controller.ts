import { 
    Body,
    ClassSerializerInterceptor,
    Controller,
    Delete,
    Get,
    NotFoundException,
    Param, ParseIntPipe,
    Patch,
    Post,
    Query,
    UseInterceptors 
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersDto } from './dto/find-users.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }

    @Get()
    findAll(@Query() query: FindUsersDto) {
        return this.usersService.findAll(query.role);
    }

    @Get('recherche')
    recherche(@Query() query: SearchUsersDto) {
        return this.usersService.recherche(query.q);
    }

    @Get('email/:email')
    async findEmail(@Param('email') email: string) {
        const user = await this.usersService.findEmail(email);
        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }
        return user;
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const user = await this.usersService.findOne(id);
        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }
        return user;
    }

    @Patch(':id')
    update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
        return this.usersService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number) {
        const user = this.usersService.remove(id);
        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }
        return user;
    }

}