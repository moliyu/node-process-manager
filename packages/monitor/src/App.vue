<template>
  <div class="p-4">
    <el-config-provider :locale="zhCn">
      <div class="text-right">
        <el-button type="primary" @click="handleAdd">新增</el-button>
        <el-button type="primary" @click="handleRefresh">刷新</el-button>
      </div>
      <el-table :data="apps" border class="mt-4" v-loading="loading">
        <el-table-column label="名称" prop="name"></el-table-column>
        <el-table-column label="项目路径" prop="path" min-width="200"></el-table-column>
        <el-table-column label="命令" prop="command"></el-table-column>
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="row.active ? 'success' : 'primary'">{{ row.active ? '已启动' : '已停止' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="参数" prop="args"></el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-space>
              <el-text type="primary" v-if="!row.active" class="cursor-pointer" @click="handleStart(row)">启动</el-text>
              <el-text type="primary" v-if="row.active" class="cursor-pointer" @click="handleStop(row)">停止</el-text>
              <el-text type="primary" v-if="row.active" class="cursor-pointer" @click="handleViewLog(row)">查看日志</el-text>
              <el-text type="danger" v-if="!row.active" class="cursor-pointer" @click="handlRemove(row)">删除</el-text>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </el-config-provider>

    <add-modal ref="addRef"></add-modal>

    <el-dialog v-model="logDialogVisible" title="日志" width="800">
      <el-scrollbar height="400px">
        <pre>{{ currentLog }}</pre>
      </el-scrollbar>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import type { App } from './type'
import { zhCn } from 'element-plus/es/locales.mjs'

onMounted(() => {
  fetchData()
})

const apps = ref<App[]>([])
const loading = ref(false)
const addRef = useTemplateRef('addRef')

const handleAdd = async () => {
  await addRef.value?.add()
  fetchData()
}

const fetchData = async () => {
  loading.value = true
  const [err, res] = await try_http<App[]>({
    url: '/list',
  })
  loading.value = false
  if (!err) {
    apps.value = res.data
  }
}

const handleStart = async (row: App) => {
  const [err] = await try_http({
    url: '/start',
    method: 'post',
    data: {
      name: row.name,
    },
  })
  if (!err) {
    ElMessage.success('操作成功')
    fetchData()
  }
}

const handleStop = async (row: App) => {
  const [err] = await try_http({
    url: '/stop',
    method: 'post',
    data: {
      name: row.name,
    },
  })
  if (!err) {
    ElMessage.success('操作成功')
    fetchData()
  }
}

const handleRefresh = () => {
  fetchData()
}

const handlRemove = (row: App) => {
  ElMessageBox.confirm(`是否删除服务${row.name}`, '提示', {
    type: 'warning',
    async beforeClose(action, instance, done) {
      if (action == 'confirm') {
        instance.confirmButtonLoading = true
        const [err] = await try_http({
          url: '/delete',
          method: 'post',
          data: {
            name: row.name,
          },
        })
        instance.confirmButtonLoading = false
        if (!err) {
          ElMessage.success('删除成功')
          fetchData()
          done()
        }
      } else {
        done()
      }
    },
  })
}

const logDialogVisible = ref(false)
const currentLog = ref('')

const handleViewLog = async (row: App) => {
  const [err, res] = await try_http<string[]>({
    url: `/log/${row.name}`,
  })
  if (!err) {
    currentLog.value = res.data.join('\n')
    logDialogVisible.value = true
  }
}
</script>
