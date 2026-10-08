export function assertPositive(values: Record<string, number>): void {
  for (const [name, value] of Object.entries(values)) {
    if (!(value > 0)) throw new RangeError(`${name} must be a positive number, got ${value}`);
  }
}

export function assertAtLeast(min: number, values: Record<string, number>): void {
  for (const [name, value] of Object.entries(values)) {
    if (!(value >= min)) throw new RangeError(`${name} must be at least ${min}, got ${value}`);
  }
}

export function assertInRange(
  name: string,
  value: number,
  range: { min: number; max: number },
): void {
  if (!(value >= range.min && value <= range.max)) {
    throw new RangeError(`${name} must be within ${range.min}–${range.max}, got ${value}`);
  }
}
