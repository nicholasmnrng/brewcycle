export type DashboardRole = "ADMIN" | "CAFE" | "DRIVER" | "BUYER";

const dashboardRoles: DashboardRole[] = ["ADMIN", "CAFE", "DRIVER", "BUYER"];

export function isDashboardRole(role: string | null | undefined): role is DashboardRole {
  return dashboardRoles.includes(role as DashboardRole);
}

export function dashboardHomeForRole(role: string | null | undefined) {
  return isDashboardRole(role) ? "/dashboard" : "/login";
}

export function canAccessRoleRoute(role: string | null | undefined, allowedRoles: readonly DashboardRole[]) {
  return isDashboardRole(role) && allowedRoles.includes(role);
}
