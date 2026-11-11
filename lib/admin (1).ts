import type { Role } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import type {
    CertificationRequest,
    CredentialStatus,
    DocumentType,
} from "@/lib/types (1)";

// These mirror the backend admin DTOs (AdminStatsResponse, AdminUserResponse, AdminCredentialResponse)

export type AdminStats = {
  users: {
    total: number;
    users: number;
    officers: number;
    admins: number;
    inactive: number;
  };
  requests: {
    total: number;
    waiting: number;
    underReview: number;
    approved: number;
    rejected: number;
    resubmissionRequired: number;
  };
  credentials: {
    total: number;
    active: number;
    expired: number;
    revoked: number;
  };
};

export type AdminUser = {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  role: Role;
  active: boolean;
  createdAt: string | null;
  requestCount: number; // requests the person submitted
  reviewedCount: number; // requests an officer decided
};

export type AdminCredential = {
  credentialId: number;
  holderName: string;
  holderEmail: string;
  documentType: DocumentType;
  status: CredentialStatus;
  verificationCode: string;
  issuedAt: string;
  validUntil: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
};

export function fetchAdminStats() {
  return apiRequest<AdminStats>("/api/admin/stats");
}

export function fetchAdminUsers() {
  return apiRequest<AdminUser[]>("/api/admin/users");
}

export function fetchAdminRequests() {
  return apiRequest<CertificationRequest[]>("/api/admin/requests");
}

export function fetchAdminCredentials() {
  return apiRequest<AdminCredential[]>("/api/admin/credentials");
}

/** Promote a user to officer, or turn an officer back into a normal user. */
export function changeUserRole(
  userId: number,
  role: "USER" | "POLICE_OFFICER",
) {
  return apiRequest<AdminUser>(`/api/admin/users/${userId}/role`, {
    method: "PUT",
    body: { role },
  });
}

export function setUserActive(userId: number, active: boolean) {
  return apiRequest<AdminUser>(`/api/admin/users/${userId}/active`, {
    method: "PUT",
    body: { active },
  });
}
