import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../../../app.module';
import { ConfigError, loadConfig } from '../../../../config/load-config';
import { loadEnvFileIfPresent } from '../../../../config/load-env-file';
import { SetPasswordUseCase } from '../../application/use-cases/set-password.use-case';
import { UserNotFoundError, WeakPasswordError } from '../../domain/errors';

/**
 * Sets a new password for an account (no reset by email yet):
 *   printf '%s' "$PASSWORD" | node dist/modules/identity/presentation/cli/set-password.cli.js <email>
 * The password comes on stdin, never as an argument, so it stays out of the shell history and `ps`.
 */
async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks)
    .toString('utf8')
    .replace(/\r?\n$/, '');
}

async function main(): Promise<void> {
  const [email] = process.argv.slice(2);
  if (!email) {
    process.stderr.write('Usage: printf "%s" "$PASSWORD" | set-password.cli.js <email>\n');
    process.exit(1);
  }
  const password = await readStdin();

  loadEnvFileIfPresent();
  const app = await NestFactory.createApplicationContext(
    AppModule.register(loadConfig(process.env)),
    { logger: ['error'] },
  );
  try {
    await app.get(SetPasswordUseCase).execute({ email, password });
    process.stdout.write(`New password set for ${email}; its other sessions were closed.\n`);
  } catch (error) {
    if (error instanceof WeakPasswordError)
      process.stderr.write('The password needs 12 to 128 characters.\n');
    else if (error instanceof UserNotFoundError)
      process.stderr.write(`No user with email ${email}.\n`);
    else throw error;
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof ConfigError ? error.message : String(error)}\n`);
  process.exit(1);
});
