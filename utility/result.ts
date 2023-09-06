export type Result<T> =
    { ok: true, value: T } |
    { ok: false, error: string }

export const Ok = <T>(data: T): Result<T> => ({ ok: true, value: data });
export const Err = (message: string): Result<never> => ({ ok: false, error: message });
