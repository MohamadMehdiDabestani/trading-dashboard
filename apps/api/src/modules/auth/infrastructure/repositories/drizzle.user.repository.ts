import { eq, users, type Db } from "@repo/db";
import { UserRepository } from "../../types/user.repository";
import { EditProfileDto } from "@repo/types";
import { AppError } from "@/errors/appError";

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
      .values({ phone, isActive: true })
      .returning({ id: users.id, phone: users.phone, role: users.role });

    if (!user) throw new Error("Failed to create user");

    return user;
  }
  async createWithPassword(d: {
    phone: string;
    userName: string;
    passwordHash: string;
  }) {
    const [u] = await this.db
      .insert(users)
      .values({ ...d, isActive: true }) // isActive because it is a demo account
      .returning();
    if (!u) throw new AppError("INTERNAL_SERVER_ERROR");
    return u;
  }
  async setPassword(
    userId: string,
    d: { passwordHash: string; userName: string },
  ) {
    await this.db.update(users).set(d).where(eq(users.id, userId));
  }
}
