import { ApiKeyCreateSchema } from '#db/repositories/apiKey/types';

export default definePermissionEventHandler(
  'me',
  'update',
  async ({ event, user, checkPermissions }) => {
    const { name, expiresAt } = await readValidatedBody(
      event,
      validateZod(ApiKeyCreateSchema, event)
    );

    checkPermissions(user);

    const { key, record } = await Database.apiKeys.create(
      user.id,
      name,
      expiresAt
    );

    // Return the plain text key only once
    return {
      key,
      id: record.id,
      name: record.name,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
    };
  }
);
