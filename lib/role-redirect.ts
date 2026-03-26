/**
 * Retorna a rota de destino correta para cada nível de acesso.
 * Centraliza a lógica de redirect por role em um único lugar.
 */
export type UserRole = "admin" | "bdr_admin" | "user" | "bdr_user"

export function getHomeByRole(role: UserRole | string | null, slug?: string | null): string {
  switch (role) {
    case "admin":
      return "/admin/dashboard"
    case "bdr_admin":
      return "/admin/bdr"
    case "bdr_user":
      return slug ? `/${slug}/bdr` : "/portal/bdr"
    case "user":
    default:
      return slug ? `/${slug}/dashboard` : "/portal/dashboard"
  }
}
