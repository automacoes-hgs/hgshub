/**
 * Retorna a rota de destino correta para cada nível de acesso.
 * Centraliza a lógica de redirect por role em um único lugar.
 */
export type UserRole = "admin" | "bdr_admin" | "user" | "bdr_user"

export function getHomeByRole(role: UserRole | string | null, _slug?: string | null): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard"
    case "bdr_admin":
      return "/admin/tools/bdr"
    case "bdr_user":
      return "/portal/bdr"
    case "user":
    default:
      return "/portal/dashboard"
  }
}
