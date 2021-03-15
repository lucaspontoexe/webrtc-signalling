/**
 * Generates a pseudo-hash
 * @returns string with a random number
 */
export function generateRandomNumber() {
  return String(Math.floor(Math.random() * 10000));
}
