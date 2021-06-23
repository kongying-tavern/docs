---
title: Documentation
sidebar:
  [
    { text: "快速上手", link: "/developer/documentation/" },
    { text: "文档规范", link: "/developer/documentation/spec/" },
  ]
---

## Documentation Update

<div class="documentation-update">

<el-timeline>
  <el-timeline-item
    v-for="(update, index) in updateList"
    :key="index"
    :type="update.type"
    :size="update.size"
    :timestamp="update.timestamp">
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span style="color: var(--text-color-light);">{{ update.title }}</span>
        </div>
      </template>
      {{ update.content }}
    </el-card>
  </el-timeline-item>
</el-timeline>

</div>

<script setup>
import { ref } from 'vue';

const updateList = ref([
  {
    title: "1.0.0-beta.0",
    content: '初始化',
    timestamp: '2021-06-16 16:28',
    size: 'large',
  },
  {
    title: "1.0.0-beta.1",
    content: '完善教程和首页',
    timestamp: '2021-06-17 11:30',
    size: 'large',
  }
]);
</script>
