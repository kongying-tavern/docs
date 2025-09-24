import { useUserInfoStore } from '@/stores/useUserInfo'
import { computed } from 'vue'
import { usePermissionData } from './usePermissionData'

const rolesPermissions = {
  teamMember: ['edit_feedback', 'manage_feedback', 'write_blog', 'manage_blog'],
  feedbackMember: ['manage_feedback', 'edit_feedback'],
  blogMember: ['write_blog', 'manage_feedback'],
  author: ['edit_feedback'],
} as const

type Role = keyof typeof rolesPermissions
type Permission = (typeof rolesPermissions)[Role][number]

export function useRuleChecks(inputId: string | number = '') {
  const userInfo = useUserInfoStore()
  const { getTeamMemberIds, getFeedbackMemberIds, getBlogMemberIds } = usePermissionData()

  const id = computed(() => userInfo.info?.id || 0)

  const userRolesMap = computed(() => ({
    teamMember: getTeamMemberIds.value,
    feedbackMember: getFeedbackMemberIds.value,
    blogMember: getBlogMemberIds.value,
  }))

  const staticRoles = computed(() => {
    return (
      Object.keys(userRolesMap.value) as Array<keyof typeof userRolesMap.value>
    ).filter(role => userRolesMap.value[role].has(Number(id.value)))
  })

  const userRoles = computed((): Array<Role> => {
    return String(inputId) === String(userInfo.info?.id)
      ? [...staticRoles.value, 'author']
      : staticRoles.value
  })

  const userPermissions = computed(() => {
    return userRoles.value.reduce<string[]>((perms, role) => {
      return perms.concat(rolesPermissions[role] || [])
    }, [])
  })

  const hasAnyPermissions = (...permissions: Permission[]) =>
    computed(() =>
      permissions.some(permission =>
        userPermissions.value.includes(permission),
      ),
    )

  const hasAllPermissions = (...permissions: Permission[]) =>
    computed(() =>
      permissions.every(permission =>
        userPermissions.value.includes(permission),
      ),
    )

  const hasAnyRoles = (...roles: Role[]) =>
    computed(() => roles.some(role => userRoles.value.includes(role)))

  const hasAllRoles = (...roles: Role[]) =>
    computed(() => roles.every(role => userRoles.value.includes(role)))

  const isOfficial = (userId: string | number) => {
    return computed(() => {
      userId ??= id.value
      return (
        userRolesMap.value.feedbackMember.has(Number(userId))
        || userRolesMap.value.teamMember.has(Number(userId))
      )
    })
  }

  return {
    hasAnyPermissions,
    hasAllPermissions,
    hasAnyRoles,
    hasAllRoles,
    isOfficial,
  }
}
