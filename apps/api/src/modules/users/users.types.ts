export interface UserListItem {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  avatarUrl: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ResetPasswordResult {
  email: string
  password: string
  name: string
}
