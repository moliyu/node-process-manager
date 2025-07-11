<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <el-config-provider :locale="zhCn">
      <div class="max-w-7xl mx-auto px-6 py-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">进程管理器</h1>
          <p class="text-gray-600">管理和监控您的应用程序进程</p>
        </div>

        <!-- Action Bar -->
        <div class="bg-white rounded-lg p-4 mb-6" style="box-shadow: var(--el-box-shadow)">
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-4">
              <el-tag :type="apps.filter((app) => app.active).length > 0 ? 'success' : 'info'" size="large">
                <div class="i-e-monitor mr-1"></div>
                运行中: {{ apps.filter((app) => app.active).length }} / {{ apps.length }}
              </el-tag>
            </div>
            <div class="flex space-x-3">
              <el-button type="success" @click="handleAdd" size="large">
                <div class="i-e-plus mr-1"></div>
                新增应用
              </el-button>
              <el-button type="primary" @click="handleRefresh" size="large" :loading="loading">
                <div class="i-e-refresh mr-1"></div>
                刷新
              </el-button>
            </div>
          </div>
        </div>

        <!-- Main Table -->
        <div class="bg-white rounded-lg overflow-hidden" style="box-shadow: var(--el-box-shadow)">
          <el-table
            :data="apps"
            v-loading="loading"
            class="w-full"
            :row-class-name="tableRowClassName"
            empty-text="暂无应用数据"
            element-loading-text="正在加载..."
          >
            <el-table-column label="应用信息" min-width="250">
              <template #default="{ row }">
                <div class="flex items-center space-x-3">
                  <div
                    class="w-10 h-10 bg-blue rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                  >
                    {{ row.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="font-semibold text-gray-800">{{ row.name }}</div>
                    <div class="text-sm text-gray-500 truncate max-w-xs">{{ row.path }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>

            <el-table-column label="命令" prop="command" min-width="150">
              <template #default="{ row }">
                <el-tag type="info" size="small" class="font-mono">{{ row.command }}</el-tag>
              </template>
            </el-table-column>

            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="row.active ? 'success' : 'info'" size="large" :effect="row.active ? 'dark' : 'plain'">
                  <div class="mr-1" :class="row.active ? 'i-e-video-play' : 'i-e-video-pause'"></div>
                  {{ row.active ? '运行中' : '已停止' }}
                </el-tag>
              </template>
            </el-table-column>

            <el-table-column label="参数" prop="args" min-width="120">
              <template #default="{ row }">
                <el-tag v-if="row.args" type="warning" size="small" class="font-mono">{{ row.args }}</el-tag>
                <span v-else class="text-gray-400">-</span>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="320" fixed="right">
              <template #default="{ row }">
                <div class="flex space-x-2">
                  <el-button v-if="!row.active" type="success" size="small" @click="handleStart(row)" plain>
                    <div class="i-e-video-play mr-1"></div>
                    启动
                  </el-button>
                  <el-button v-if="row.active" type="warning" size="small" @click="handleStop(row)" plain>
                    <div class="i-e-video-pause mr-1"></div>
                    停止
                  </el-button>
                  <el-button type="primary" size="small" @click="handleViewLog(row)" plain>
                    <div class="i-e-document mr-1"></div>
                    日志
                  </el-button>
                  <el-button v-if="!row.active" type="info" size="small" @click="handleEdit(row)" plain>
                    <div class="i-e-edit mr-1"></div>
                    编辑
                  </el-button>
                  <el-button v-if="!row.active" type="danger" size="small" @click="handlRemove(row)" plain>
                    <div class="i-e-delete mr-1"></div>
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-config-provider>

    <add-modal ref="addRef"></add-modal>

    <el-dialog v-model="logDialogVisible" title="应用日志" width="80%" :close-on-click-modal="false" class="log-dialog">
      <div class="bg-gray-900 rounded-lg p-4">
        <el-scrollbar height="500px">
          <pre class="text-green-400 font-mono text-sm leading-relaxed">{{ currentLog || '暂无日志数据' }}</pre>
        </el-scrollbar>
      </div>
      <template #footer>
        <el-button @click="logDialogVisible = false">关闭</el-button>
      </template>
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

const handleEdit = async (row: App) => {
  await addRef.value?.edit(row)
  ElMessage.success('操作成功')
  fetchData()
}

const tableRowClassName = ({ row }: { row: App }) => {
  return row.active ? 'running-row' : 'stopped-row'
}
</script>

<style scoped>
.running-row {
  background-color: #f0f9ff;
}

.stopped-row {
  background-color: #f9fafb;
}

.log-dialog .el-dialog__body {
  padding: 20px;
}
</style>
