const requiredVars = [
  'DATABASE_URL',
  'AUTH_SECRET',
] as const;

const optionalVars = [
  'ANTHROPIC_API_KEY',
  'KIS_APP_KEY',
  'KIS_APP_SECRET',
  'FINNHUB_API_KEY',
  'AUTH_GOOGLE_ID',
  'AUTH_GOOGLE_SECRET',
] as const;

export function validateEnv() {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of requiredVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  for (const key of optionalVars) {
    if (!process.env[key]) {
      warnings.push(key);
    }
  }

  if (warnings.length > 0) {
    console.warn(
      `[NewsStock AI] 선택적 환경변수 미설정 (일부 기능 제한): ${warnings.join(', ')}`
    );
  }

  if (missing.length > 0) {
    console.error(
      `[NewsStock AI] 필수 환경변수 누락: ${missing.join(', ')}\n` +
        '.env.local.example을 참고하여 .env.local 파일을 생성하세요.'
    );
  }
}
