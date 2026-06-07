import { Db, users } from "@repo/db/src";
import { UserRepository } from "../../application/interfaces/user.repository";
import { eq } from "drizzle-orm";

export class DrizzleUserRepository implements UserRepository {
  constructor(private db: Db) {}

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
