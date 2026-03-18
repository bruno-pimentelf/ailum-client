import { apiFetch } from "@/lib/api"

export type MarkTenantNotificationReadInput = {
  read?: boolean
}

export type MarkTenantNotificationReadResult = {
  id: string
  read: boolean
}

export type MarkAllTenantNotificationsReadInput = {
  maxDocs?: number
}

export type MarkAllTenantNotificationsReadResult = {
  maxDocs: number
  matched: number
  updated: number
}

export const tenantNotificationsApi = {
  markAsRead: (notificationId: string, body: MarkTenantNotificationReadInput = { read: true }) =>
    apiFetch<MarkTenantNotificationReadResult>(`/tenant/notifications/${notificationId}/read`, {
      method: "PATCH",
      body,
    }),

  markAllAsRead: (body: MarkAllTenantNotificationsReadInput = { maxDocs: 1000 }) =>
    apiFetch<MarkAllTenantNotificationsReadResult>("/tenant/notifications/read-all", {
      method: "PATCH",
      body,
    }),
}

