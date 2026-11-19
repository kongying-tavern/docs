export interface Member {
  name: string
  title?: string
  order?: number
}

export interface StaffListItem {
  id: string
  label: string
  members: Member[]
}
