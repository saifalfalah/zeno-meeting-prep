import { auth } from './config'

/**
 * Validates that the current session has a valid Google access token
 * @returns Object with isValid flag and optional error details
 */
export async function validateGoogleSession() {
  const session = await auth()

  if (!session) {
    return {
      isValid: false,
      error: 'NO_SESSION',
      message: 'No active session found. Please sign in.',
      requiresReauth: true
    }
  }

  if (!session.access_token) {
    return {
      isValid: false,
      error: 'NO_ACCESS_TOKEN',
      message: 'Session is missing Google Calendar permissions. Please sign in again.',
      requiresReauth: true
    }
  }

  if (session.error === 'RefreshAccessTokenError') {
    return {
      isValid: false,
      error: 'TOKEN_REFRESH_FAILED',
      message: 'Google Calendar access has expired. Please sign in again.',
      requiresReauth: true
    }
  }

  return {
    isValid: true,
    session
  }
}

/**
 * Gets the current session with type safety
 * Throws an error if session is invalid
 */
export async function getRequiredSession() {
  const validation = await validateGoogleSession()

  if (!validation.isValid) {
    throw new Error(validation.message)
  }

  return validation.session!
}
