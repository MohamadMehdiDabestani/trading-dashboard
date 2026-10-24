import { User } from "@repo/db";
import { EditProfileDto, Role } from "@repo/types";

export interface UserRepository {
  findByPhone(phone: string): Promise<User | null>;

  findById(id: string): Promise<User |  null>;

  create(phone: string): Promise<{
    id: string;
    phone: string;
    role : Role
  }>;

  simpleUpdate(userId : string , data : EditProfileDto) : Promise<void>
}
