import { Injectable, Inject } from '@nestjs/common';
import { UserRepository, UserUpdateData } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserNotFoundError } from '../../domain/errors/user.errors';
import { UpdateUserDto } from '../dto/update-user.dto';
import { USER_REPOSITORY } from '../../users.tokens';

@Injectable()
export class UpdateUserUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepository) {}

  async execute(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findById(id);
    
    if (!existingUser) {
      throw new UserNotFoundError(id);
    }

    const updateData: UserUpdateData = {};
    if (updateUserDto.email !== undefined) updateData.email = updateUserDto.email;
    if (updateUserDto.password !== undefined) updateData.password = updateUserDto.password;
    if (updateUserDto.name !== undefined) updateData.name = updateUserDto.name;
    if (updateUserDto.role !== undefined) updateData.role = updateUserDto.role;

    return this.userRepository.update(id, updateData);
  }
}

