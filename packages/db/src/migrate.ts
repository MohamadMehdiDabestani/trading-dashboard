import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const runMigrations = async () => {
  const connectionString = "postgresql://postgres:kVuMaVooFVV3WGn4@services.irn13.chabokan.net:54791/angel"
  
  const migrationClient = postgres(connectionString, { max: 1 });
  
  await migrate(drizzle(migrationClient), {
    migrationsFolder: '../drizzle',
  });

  await migrationClient.end();
  console.log('Migrations completed!');
};

runMigrations().catch(console.error);