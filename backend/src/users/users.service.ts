import {
  Injectable,
  Inject,
  NotFoundException,
  InternalServerErrorException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseClient } from '@supabase/supabase-js';
import * as path from 'path';

import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { SUPABASE_CLIENT } from '../supabase/supabase.provider';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    // Wstrzykujemy klienta Supabase (lub null, jeśli jest wyłączony).
    // Używamy dekoratora @Inject, aby jawnie wskazać, którego dostawcę chcemy.
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient | null,
  ) {}


  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(
        `Użytkownik o ID ${id} nie został znaleziony.`,
      );
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // `preload` wczytuje encję i scala ją z nowymi danymi, ale nie zapisuje.
    const userToUpdate = await this.userRepository.preload({
      id,
      ...updateUserDto,
    });
    if (!userToUpdate) {
      throw new NotFoundException(
        `Użytkownik o ID ${id} nie został znaleziony do aktualizacji.`,
      );
    }
    return this.userRepository.save(userToUpdate);
  }

  // --- Przesyłanie awatara (działa tylko w trybie Supabase) ---

  async uploadAvatar(userId: string, file: Express.Multer.File): Promise<User> {
    // Strażnik funkcji: jeśli `this.supabase` jest `null`, oznacza to,
    // że jesteśmy w trybie lokalnym i ta funkcja jest niedostępna.
    if (!this.supabase) {
      throw new ForbiddenException(
        'Przesyłanie awatarów jest dostępne tylko w trybie Supabase.',
      );
    }

    const user = await this.findOne(userId);
    const bucketName = 'avatars';
    const fileExtension = path.extname(file.originalname);
    const filePath = `${userId}/avatar-${Date.now()}${fileExtension}`;

    // Krok 1: Opcjonalne usunięcie starego awatara, aby nie zaśmiecać storage.
    if (user.avatarUrl) {
      try {
        const oldAvatarPath = user.avatarUrl.split(`${bucketName}/`)[1];
        if (oldAvatarPath) {
          await this.supabase.storage.from(bucketName).remove([oldAvatarPath]);
          this.logger.log(
            `Usunięto stary awatar użytkownika ${userId}: ${oldAvatarPath}`,
          );
        }
      } catch (error) {
        // Logujemy błąd, ale nie przerywamy procesu, jeśli usunięcie się nie uda.
        this.logger.warn(
          `Nie udało się usunąć starego awatara: ${
            typeof error === 'object' && error !== null && 'message' in error
              ? (error as { message?: string }).message
              : String(error)
          }`,
        );
      }
    }

    // Krok 2: Przesłanie nowego pliku.
    const { error: uploadError } = await this.supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false, // `false` jest bezpieczniejsze, aby uniknąć nadpisania, jeśli nazwa się powtórzy
      });

    if (uploadError) {
      this.logger.error(
        'Błąd podczas przesyłania awatara do Supabase',
        uploadError,
      );
      throw new InternalServerErrorException('Nie udało się przesłać awatara.');
    }

    // Krok 3: Pobranie publicznego URL do nowego pliku.
    const { data: urlData } = this.supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    // Krok 4: Zaktualizowanie encji użytkownika i zapisanie w bazie danych.
    user.avatarUrl = urlData.publicUrl;
    return this.userRepository.save(user);
  }
}
