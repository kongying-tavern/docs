import instance from './http'
import { useAxios } from '@vueuse/integrations/useAxios'
import type { ClientActivatedVersionData } from './typing'
// Learn more: https://vueuse.org/integrations/useAxios/

export const getClientActivatedVersionData = useAxios(
  '/version/activated',
  instance
)
