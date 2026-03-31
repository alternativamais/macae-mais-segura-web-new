import { User } from "@/types/auth"

export interface MyProfile extends User {
  birthday?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface UpdateMyProfilePayload {
  name?: string
  username?: string
  email?: string
  birthday?: string
  avatarUrl?: string
  themeModePreference?: "light" | "dark"
  currentPassword?: string
  newPassword?: string
}
