export default definePermissionEventHandler(
  'me',
  'update',
  async ({ user, checkPermissions }) => {
    checkPermissions(user);

    const apiKeys = await Database.apiKeys.getAllByUser(user.id);

    // Don't return the key hash, only metadata
    return apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    }));
  }
);
