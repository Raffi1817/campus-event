export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string }

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}
