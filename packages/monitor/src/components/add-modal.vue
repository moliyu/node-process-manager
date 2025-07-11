<template>
  <el-dialog v-model="open" :title="mode == 'edit' ? '编辑' : '新增'">
    <el-form label-width="80">
      <el-form-item label="名称">
        <el-input placeholder="请输入名称" v-model="form.name" :disabled="mode == 'edit'"></el-input>
      </el-form-item>

      <el-form-item label="项目路径">
        <el-input placeholder="请输入项目路径" v-model="form.path"></el-input>
      </el-form-item>

      <el-form-item label="命令">
        <el-input placeholder="请输入命令" v-model="form.command"></el-input>
      </el-form-item>

      <el-form-item label="参数">
        <el-input placeholder="请输入参数" v-model="form.args"></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="open = false">取消</el-button>
      <el-button type="primary" @click="confirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import type { App } from '../type'
type Mode = 'edit' | 'add'

const mode = ref<Mode>()

let _resolve: (value: unknown) => void
const open = ref(false)

const add = async () => {
  return new Promise((resolve) => {
    _resolve = resolve
    mode.value = 'add'
    form.value = {} as App
    open.value = true
  })
}

const edit = async (row: App) => {
  return new Promise((resolve) => {
    _resolve = resolve
    mode.value = 'edit'
    form.value = { ...row }
    open.value = true
  })
}

const form = ref({} as App)

const confirm = async () => {
  if (mode.value == 'add') {
    const [err] = await try_http({
      url: '/add',
      method: 'post',
      data: form.value,
    })
    if (!err) {
      open.value = false
      _resolve(true)
    }
  } else if (mode.value == 'edit') {
    const [err] = await try_http({
      url: `/modify/${form.value.name}`,
      method: 'post',
      data: form.value,
    })
    if (!err) {
      open.value = false
      _resolve(true)
    }
  }
}

defineExpose({
  add,
  edit,
})
</script>
