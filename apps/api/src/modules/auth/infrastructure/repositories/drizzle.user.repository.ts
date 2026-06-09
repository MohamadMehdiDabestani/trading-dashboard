import { users , type Db } from "@repo/db";
import { UserRepository } from "../../types/user.repository";
import { eq } from "drizzle-orm";
import { EditProfileDto } from "@repo/types";

export class DrizzleUserRepository implements UserRepository {
  constructor(private db: Db) {}
  
  async simpleUpdate(userId: string, data: EditProfileDto): Promise<undefined> {
    await this.db
      .update(users)
      .set({
        email: data.email,
        userName: data.userName,
      })
      .where(eq(users.id, userId));

  }

  async findByPhone(phone: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.phone, phone))
      .limit(1);

    return user ?? null;
  }

  async findById(id: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user ?? null;
  }

  async create(phone: string) {
    const [user] = await this.db
      .insert(users)
      .values({ phone })
      .returning({ id: users.id, phone: users.phone });

    if (!user) throw new Error("Failed to create user");

    return user;
  }
}
