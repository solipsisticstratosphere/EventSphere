import { Injectable, Inject } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserEmailNotFoundError } from '../../domain/errors/user.errors';
import { USER_REPOSITORY } from '../../users.tokens';

@Injectable()
export class GetUserByEmailUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly userRepository: UserRepository) {}

  async execute(email: string): Promise<User> {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new UserEmailNotFoundError(email);
    }

    return user;
  }
}

