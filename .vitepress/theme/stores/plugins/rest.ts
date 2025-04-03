import type { Store } from 'pinia'
import { cloneDeep } from 'lodash-es'

export default function resetStore({ store }: { store: Store }) {
  const initialState = cloneDeep(store.$state)
  store.$reset = () => store.$patch(cloneDeep(initialState))
}
