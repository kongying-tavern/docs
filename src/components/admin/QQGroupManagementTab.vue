<script setup lang="ts">
import type { QQGroup } from '~/services/qqGroupService'
import { useSortable } from '@vueuse/integrations/useSortable'
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { qqGroupService } from '~/services/qqGroupService'

const loading = ref(false)
const groups = ref<QQGroup[]>([])
const showDialog = ref(false)
const showResetDialog = ref(false)
const showDeleteDialog = ref(false)
const editingGroup = ref<QQGroup | null>(null)
const deletingGroup = ref<QQGroup | null>(null)

const formData = ref({
  name: '',
  number: '',
  link: '',
  status: 'normal' as QQGroup['status'],
  tooltip: '',
})

const editingCell = ref<{ groupId: string, field: keyof QQGroup } | null>(null)
const editingValue = ref('')

const stats = computed(() => qqGroupService.getStatusStats())

const statusOptions = [
  { value: 'suggest', label: '推荐', color: 'bg-green-100 text-green-800' },
  { value: 'warning', label: '已满', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'banned', label: '被封禁', color: 'bg-gray-100 text-gray-600' },
  { value: 'normal', label: '正常', color: 'bg-gray-100 text-gray-800' },
] as const

const statsCards = [
  { key: 'total', label: '总群数', icon: 'i-lucide-users', color: 'text-blue-600' },
  { key: 'suggest', label: '推荐群', icon: 'i-lucide-star', color: 'text-green-600' },
  { key: 'warning', label: '已满群', icon: 'i-lucide-alert-triangle', color: 'text-yellow-600' },
  { key: 'banned', label: '被封禁', icon: 'i-lucide-ban', color: 'text-gray-600' },
] as const

const tableBodyRef = ref<HTMLElement>()
useSortable(tableBodyRef, groups, {
  handle: '.drag-handle',
  onUpdate: () => {
    groups.value.forEach((group, index) => {
      group.order = index
    })
    qqGroupService.reorderGroups(groups.value)
  },
})

onMounted(loadGroups)
async function loadGroups() {
  loading.value = true
  try {
    await qqGroupService.loadGroups()
    groups.value = qqGroupService.getGroups()
  }
  catch (error) {
    console.error('Failed to load groups:', error)
    toast.error('加载群组数据失败')
  }
  finally {
    loading.value = false
  }
}

function resetFormData() {
  formData.value = {
    name: '',
    number: '',
    link: '',
    status: 'normal',
    tooltip: '',
  }
}

function openAddDialog() {
  editingGroup.value = null
  resetFormData()
  showDialog.value = true
}

function openEditDialog(group: QQGroup) {
  editingGroup.value = group
  formData.value = { ...group }
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  editingGroup.value = null
}

async function saveGroup() {
  const errors = qqGroupService.validateGroup(formData.value)
  if (errors.length > 0) {
    toast.error(errors[0])
    return
  }

  if (qqGroupService.isDuplicateNumber(formData.value.number, editingGroup.value?.id)) {
    toast.error('群号已存在')
    return
  }

  try {
    if (editingGroup.value) {
      qqGroupService.updateGroup(editingGroup.value.id, formData.value)
    }
    else {
      qqGroupService.addGroup(formData.value)
    }
    groups.value = qqGroupService.getGroups()
    closeDialog()
  }
  catch (error) {
    console.error('Failed to save group:', error)
    toast.error('保存失败')
  }
}

function deleteGroup(group: QQGroup) {
  deletingGroup.value = group
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!deletingGroup.value)
    return

  try {
    qqGroupService.deleteGroup(deletingGroup.value.id)
    groups.value = qqGroupService.getGroups()
  }
  catch (error: Error) {
    toast.error(`删除失败 (${error.message})`)
  }
  finally {
    showDeleteDialog.value = false
    deletingGroup.value = null
  }
}

function cancelDelete() {
  showDeleteDialog.value = false
  deletingGroup.value = null
}

function startEdit(group: QQGroup, field: keyof QQGroup) {
  if (field === 'status')
    return

  editingCell.value = { groupId: group.id, field }
  editingValue.value = String(group[field])
}

function stopEdit() {
  editingCell.value = null
}

function saveEdit() {
  if (!editingCell.value)
    return

  const { groupId, field } = editingCell.value
  const group = groups.value.find(g => g.id === groupId)
  if (!group)
    return

  if (field === 'number' && !/^\d+$/.test(editingValue.value)) {
    toast.error('群号必须是数字')
    return
  }

  if (field === 'number' && qqGroupService.isDuplicateNumber(editingValue.value, groupId)) {
    toast.error('群号已存在')
    return
  }

  const updates = { [field]: editingValue.value }
  qqGroupService.updateGroup(groupId, updates)
  Object.assign(group, updates)
  groups.value = qqGroupService.getGroups()
  stopEdit()
}

function isEditing(group: QQGroup, field: keyof QQGroup): boolean {
  return editingCell.value?.groupId === group.id && editingCell.value?.field === field
}

function updateStatus(group: QQGroup, newStatus: QQGroup['status']) {
  qqGroupService.updateGroup(group.id, { status: newStatus })
  group.status = newStatus
  groups.value = qqGroupService.getGroups()
}

function getStatusOption(status: QQGroup['status']) {
  return statusOptions.find(opt => opt.value === status) || statusOptions[3]
}

async function exportJSON() {
  try {
    const exportData = groups.value.map(({ order, ...group }) => group)
    const jsonData = JSON.stringify(exportData, null, 2)
    await navigator.clipboard.writeText(jsonData)

    const githubJsonUrl = 'https://github.com/kongying-tavern/docs/blob/main/docs/src/_data/qq-groups.json'

    toast.success('JSON已复制到剪贴板', {
      action: {
        label: '查看 GitHub',
        onClick: () => window.open(githubJsonUrl, '_blank'),
      },
    })
  }
  catch (error) {
    console.error('Failed to copy to clipboard:', error)
    toast.error('复制到剪贴板失败')
  }
}

function resetToOriginal() {
  showResetDialog.value = true
}

async function confirmReset() {
  loading.value = true
  try {
    await qqGroupService.resetToOriginalData()
    groups.value = qqGroupService.getGroups()
  }
  catch (error) {
    console.error('Reset failed:', error)
    toast.error('重置失败')
  }
  finally {
    loading.value = false
    showResetDialog.value = false
  }
}

function cancelReset() {
  showResetDialog.value = false
}

function reorderAndUpdate(newGroups: QQGroup[]) {
  newGroups.forEach((group, i) => {
    group.order = i
  })
  groups.value = newGroups
  qqGroupService.reorderGroups(newGroups)
}

function moveUp(index: number) {
  if (index <= 0)
    return

  const newGroups = [...groups.value]
  ;[newGroups[index - 1], newGroups[index]] = [newGroups[index], newGroups[index - 1]]
  reorderAndUpdate(newGroups)
}

function moveDown(index: number) {
  if (index >= groups.value.length - 1)
    return

  const newGroups = [...groups.value]
  ;[newGroups[index], newGroups[index + 1]] = [newGroups[index + 1], newGroups[index]]
  reorderAndUpdate(newGroups)
}
</script>

<template>
  <div class="space-y-6">
    <!-- 统计卡片 -->
    <div class="gap-4 grid grid-cols-1 md:grid-cols-4">
      <Card
        v-for="card in statsCards"
        :key="card.key"
      >
        <CardHeader class="pb-2">
          <CardTitle class="text-sm flex gap-2 items-center">
            <i class="h-4 w-4" :class="[card.icon]" />
            {{ card.label }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h2 class="text-2xl font-bold" :class="card.color">
            {{ stats[card.key] }}
          </h2>
        </CardContent>
      </Card>
    </div>

    <!-- 操作栏 -->
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">
        QQ群管理
      </h2>
      <div class="flex gap-2">
        <Button variant="outline" @click="exportJSON">
          <i class="i-lucide-copy mr-2 h-4 w-4" />
          复制JSON
        </Button>
        <Button variant="outline" @click="resetToOriginal">
          <i class="i-lucide-rotate-ccw mr-2 h-4 w-4" />
          重置到原始数据
        </Button>
        <Button @click="openAddDialog">
          <i class="i-lucide-plus mr-2 h-4 w-4" />
          添加群组
        </Button>
      </div>
    </div>

    <!-- 群组表格 -->
    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-[60px]">
                排序
              </TableHead>
              <TableHead>群名称</TableHead>
              <TableHead class="w-[120px]">
                群号
              </TableHead>
              <TableHead class="w-[100px]">
                状态
              </TableHead>
              <TableHead>链接</TableHead>
              <TableHead>提示信息</TableHead>
              <TableHead class="w-[150px]">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody ref="tableBodyRef">
            <TableRow
              v-for="(group, index) in groups"
              :key="group.id"
              class="group"
            >
              <!-- 拖拽手柄 -->
              <TableCell>
                <div class="flex gap-1 items-center">
                  <div class="drag-handle text-gray-400 cursor-move hover:text-gray-600">
                    ⋮⋮
                  </div>
                  <div class="flex flex-col gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      class="text-xs px-1 h-4"
                      :disabled="index === 0"
                      @click="moveUp(index)"
                    >
                      ↑
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      class="text-xs px-1 h-4"
                      :disabled="index === groups.length - 1"
                      @click="moveDown(index)"
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              </TableCell>

              <!-- 群名称 -->
              <TableCell>
                <div v-if="isEditing(group, 'name')">
                  <Input
                    v-model="editingValue"
                    class="text-sm"
                    @blur="saveEdit"
                    @keyup.enter="saveEdit"
                    @keyup.escape="stopEdit"
                  />
                </div>
                <div
                  v-else
                  class="p-1 rounded cursor-pointer hover:bg-muted/50"
                  @click="startEdit(group, 'name')"
                >
                  {{ group.name }}
                </div>
              </TableCell>

              <!-- 群号 -->
              <TableCell>
                <div v-if="isEditing(group, 'number')">
                  <Input
                    v-model="editingValue"
                    class="text-sm"
                    @blur="saveEdit"
                    @keyup.enter="saveEdit"
                    @keyup.escape="stopEdit"
                  />
                </div>
                <div
                  v-else
                  class="text-sm font-mono p-1 rounded cursor-pointer hover:bg-muted/50"
                  @click="startEdit(group, 'number')"
                >
                  {{ group.number }}
                </div>
              </TableCell>

              <!-- 状态 -->
              <TableCell>
                <Select
                  :model-value="group.status"
                  @update:model-value="updateStatus(group, $event)"
                >
                  <SelectTrigger class="text-xs h-8">
                    <SelectValue>
                      <span
                        class="text-xs font-medium px-2 py-1 rounded-full inline-flex items-center"
                        :class="getStatusOption(group.status).color"
                      >
                        {{ getStatusOption(group.status).label }}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="option in statusOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      <span
                        class="text-xs font-medium px-2 py-1 rounded-full inline-flex items-center"
                        :class="option.color"
                      >
                        {{ option.label }}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>

              <!-- 链接 -->
              <TableCell>
                <div v-if="isEditing(group, 'link')">
                  <Input
                    v-model="editingValue"
                    class="text-sm"
                    @blur="saveEdit"
                    @keyup.enter="saveEdit"
                    @keyup.escape="stopEdit"
                  />
                </div>
                <div
                  v-else
                  class="p-1 rounded cursor-pointer hover:bg-muted/50"
                  @click="startEdit(group, 'link')"
                >
                  <span class="text-blue-600 break-all hover:underline">
                    {{ group.link }}
                  </span>
                </div>
              </TableCell>

              <!-- 提示信息 -->
              <TableCell>
                <div v-if="isEditing(group, 'tooltip')">
                  <Input
                    v-model="editingValue"
                    class="text-sm"
                    @blur="saveEdit"
                    @keyup.enter="saveEdit"
                    @keyup.escape="stopEdit"
                  />
                </div>
                <div
                  v-else
                  class="text-sm text-gray-600 p-1 rounded max-w-[200px] cursor-pointer truncate hover:bg-muted/50"
                  @click="startEdit(group, 'tooltip')"
                >
                  {{ group.tooltip }}
                </div>
              </TableCell>

              <!-- 操作 -->
              <TableCell>
                <div class="flex gap-1 items-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    @click="openEditDialog(group)"
                  >
                    <i class="i-lucide-edit-2 h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    @click="deleteGroup(group)"
                  >
                    <i class="i-lucide-trash-2 h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <!-- 空状态 -->
        <div v-if="groups.length === 0 && !loading" class="py-12 flex flex-col items-center justify-center">
          <div class="text-center">
            <h3 class="text-lg font-medium">
              没有QQ群数据
            </h3>
            <p class="text-sm text-muted-foreground mb-4">
              开始添加第一个QQ群
            </p>
            <Button @click="openAddDialog">
              <i class="i-lucide-plus mr-2 h-4 w-4" />
              添加群组
            </Button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="py-12 flex items-center justify-center">
          <div class="text-sm text-muted-foreground">
            加载中...
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 添加/编辑对话框 -->
    <Dialog v-model:open="showDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {{ editingGroup ? '编辑群组' : '添加群组' }}
          </DialogTitle>
          <DialogDescription>
            {{ editingGroup ? '修改群组信息' : '添加新的QQ群到列表' }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div>
            <Label for="name">群名称</Label>
            <Input
              id="name"
              v-model="formData.name"
              placeholder="原神地图 XX 群"
            />
          </div>

          <div>
            <Label for="number">群号</Label>
            <Input
              id="number"
              v-model="formData.number"
              placeholder="123456789"
            />
          </div>

          <div>
            <Label for="status">状态</Label>
            <Select v-model="formData.status">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in statusOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label for="link">群链接</Label>
            <Input
              id="link"
              v-model="formData.link"
              placeholder="https://qm.qq.com/q/..."
            />
          </div>

          <div>
            <Label for="tooltip">提示信息</Label>
            <Textarea
              id="tooltip"
              v-model="formData.tooltip"
              placeholder="点击一键加入..."
              rows="2"
            />
          </div>
        </div>

        <div class="mt-6 flex gap-2 justify-end">
          <Button variant="outline" @click="closeDialog">
            <i class="i-lucide-x mr-2 h-4 w-4" />
            取消
          </Button>
          <Button @click="saveGroup">
            <i class="i-lucide-check mr-2 h-4 w-4" />
            {{ editingGroup ? '更新' : '添加' }}
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 删除确认对话框 -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>
            确定要删除群组"{{ deletingGroup?.name }}"吗？此操作无法撤销。
          </DialogDescription>
        </DialogHeader>
        <div class="mt-6 flex gap-2 justify-end">
          <Button variant="outline" @click="cancelDelete">
            <i class="i-lucide-x mr-2 h-4 w-4" />
            取消
          </Button>
          <Button variant="destructive" @click="confirmDelete">
            <i class="i-lucide-trash-2 mr-2 h-4 w-4" />
            删除
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 重置确认对话框 -->
    <Dialog v-model:open="showResetDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>确认重置</DialogTitle>
          <DialogDescription>
            确定要重置到原始数据吗？这将清除所有本地修改，包括顺序调整、编辑内容等。此操作无法撤销。
          </DialogDescription>
        </DialogHeader>
        <div class="mt-6 flex gap-2 justify-end">
          <Button variant="outline" @click="cancelReset">
            <i class="i-lucide-x mr-2 h-4 w-4" />
            取消
          </Button>
          <Button variant="destructive" @click="confirmReset">
            <i class="i-lucide-rotate-ccw mr-2 h-4 w-4" />
            重置
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.drag-handle {
  font-size: 12px;
  line-height: 1;
  user-select: none;
}
</style>
