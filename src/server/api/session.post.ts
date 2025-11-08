import { UserLoginSchema } from '#db/repositories/user/types';

export default defineEventHandler(async (event) => {
  const { username, password, remember, totpCode } = await readValidatedBody(
    event,
    validateZod(UserLoginSchema, event)
  );

  // Get client IP for rate limiting
  const clientIp = getRequestIP(event, { xForwardedFor: true }) || 'unknown';
  const rateLimitKey = `${clientIp}:${username}`;

  // Check if rate limited
  if (rateLimiter.isRateLimited(rateLimitKey)) {
    const timeUntilUnlock = rateLimiter.getTimeUntilUnlock(rateLimitKey);
    const minutesUntilUnlock = Math.ceil(timeUntilUnlock / 60000);

    throw createError({
      statusCode: 429,
      statusMessage: `Too many failed login attempts. Please try again in ${minutesUntilUnlock} minute(s).`,
    });
  }

  const result = await Database.users.login(username, password, totpCode);

  // TODO: add localization support

  if (!result.success) {
    // Record failed attempt
    rateLimiter.recordFailedAttempt(rateLimitKey);

    switch (result.error) {
      case 'INCORRECT_CREDENTIALS':
        throw createError({
          statusCode: 401,
          statusMessage: 'Invalid username or password',
        });
      case 'TOTP_REQUIRED':
        return { status: 'TOTP_REQUIRED' };
      case 'INVALID_TOTP_CODE':
        // Also record failed TOTP as a failed attempt
        rateLimiter.recordFailedAttempt(rateLimitKey);
        return { status: 'INVALID_TOTP_CODE' };
      case 'USER_DISABLED':
        throw createError({
          statusCode: 401,
          statusMessage: 'User disabled',
        });
      case 'UNEXPECTED_ERROR':
        throw createError({
          statusCode: 500,
          statusMessage: 'Unexpected error',
        });
    }
    assertUnreachable(result.error);
  }

  // Reset rate limit on successful login
  rateLimiter.reset(rateLimitKey);

  const user = result.user;

  const session = await useWGSession(event, remember);

  const data = await session.update({
    userId: user.id,
  });

  // TODO?: create audit log

  SERVER_DEBUG(`New Session: ${data.id} for ${user.id} (${user.username})`);

  return { status: 'success' };
});
