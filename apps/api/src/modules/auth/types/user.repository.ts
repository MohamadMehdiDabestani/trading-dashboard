import { EditProfileDto } from "@repo/types";

export interface UserRepository {
  findByPhone(phone: string): Promise<{
    id: string;
    phone: string;
    isActive: boolean;
  } | null>;

  findById(id: string): Promise<{
    id: string;
    phone: string;
    isActive: boolean;
  } | null>;

  create(phone: string): Promise<{
    id: string;
    phone: string;
  }>;

  simpleUpdate(userId : string , data : EditProfileDto) : Promise<void>
}
