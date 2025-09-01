export function extractGSCContent(input: string): string {
  // Handle full meta tag: <meta name="google-site-verification" content="ABC123" />
  const fullTagMatch = input.match(/content="([^"]+)"/);
  if (fullTagMatch) {
    return fullTagMatch[1] ?? "";
  }

  // Handle just content value: content="ABC123"
  const contentMatch = input.match(/content="?([^"]+)"?/);
  if (contentMatch) {
    return contentMatch[1] ?? "";
  }

  // Handle just the verification code
  return input.trim();
}
