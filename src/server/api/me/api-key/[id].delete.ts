export default definePermissionEventHandler(
  'me',
  'update',
  async ({ event, user, checkPermissions }) => {
    const id = getRouterParam(event, 'id');

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'API key ID is required',
      });
    }

    checkPermissions(user);

    const keyId = parseInt(id, 10);
    if (isNaN(keyId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid API key ID',
      });
    }

    await Database.apiKeys.revokeByUser(keyId, user.id);
    return { success: true };
  }
);
