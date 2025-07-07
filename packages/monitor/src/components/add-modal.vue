<template>
  <el-dialog v-model="open" title="新增">
    <el-form label-width="80">
      <el-form-item label="名称">
        <el-input placeholder="请输入名称" v-model="form.name"></el-input>
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

let _resolve: (value: unknown) => void
const open = ref(false)

const add = async () => {
  return new Promise((resolve) => {
    _resolve = resolve
    open.value = true
  })
}

const form = ref({} as App)

const confirm = async () => {
  const [err] = await try_http({
    url: '/add',
    method: 'post',
    data: form.value,
  })
  if (!err) {
    open.value = false
    _resolve(true)
  }
}

defineExpose({
  add,
})
</script>
