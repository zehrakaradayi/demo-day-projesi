/** Server action'larda FormData'dan gelen serbest string'leri bilinen enum değerleriyle doğrulamak için. */
export function parseEnum<T extends string>(enumObj: Record<string, T>, value: FormDataEntryValue | null): T | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  return (Object.values(enumObj) as string[]).includes(value) ? (value as T) : undefined;
}

export function requireString(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`'${key}' alanı zorunlu.`);
  }
  return value.trim();
}

export function optionalString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string" || value.trim().length === 0) return undefined;
  return value.trim();
}
