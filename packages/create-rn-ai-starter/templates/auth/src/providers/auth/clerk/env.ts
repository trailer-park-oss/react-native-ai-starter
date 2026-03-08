export function validateClerkEnv(): string {
  const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!key) {
    throw new Error(
      'Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY.\n' +
      'Add it to your .env file:\n\n' +
      '  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...\n\n' +
      'Get your key from https://dashboard.clerk.com',
    )
  }

  if (!key.startsWith('pk_')) {
    throw new Error(
      `Invalid EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: "${key}".\n` +
      'The key must start with "pk_". Check your Clerk dashboard.',
    )
  }

  return key
}
