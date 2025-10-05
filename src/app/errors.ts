const noisePatterns = [
  /ResizeObserver loop limit exceeded/i,
  /ResizeObserver loop completed with undelivered notifications/i,
  /Cannot read properties of undefined \(reading '_texture'\)/i, // Cosmograph texture error
];

export default function isNoise(message?: string) {
  return !!message && noisePatterns.some((pattern) => pattern.test(message));
}
