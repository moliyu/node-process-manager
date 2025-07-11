import { Config } from './type'
import st from 'node-localstorage'
import { parseJson } from './utils'
import { ChildProcessWithoutNullStreams, spawn } from 'node:child_process'

const ls = new st.LocalStorage('./local')

export class ConfigUtil {
  configs: Config[] = []
  cache: Map<string, ChildProcessWithoutNullStreams> = new Map()
  log: Map<string, string[]> = new Map()
  constructor() {
    if (!ls.getItem('config')) {
      ls.setItem('config', JSON.stringify([]))
    }
    const configs = parseJson<Config[]>(ls.getItem('config'), [])
    this.configs = configs

    // 注册进程退出时的清理函数
    process.on('exit', () => this.destroy())
    process.on('SIGINT', () => {
      this.destroy()
      process.exit()
    })
    process.on('SIGTERM', () => {
      this.destroy()
      process.exit()
    })
  }

  destroy() {
    this.configs.forEach((config) => {
      config.active = false
    })
    this.syncConfig()
  }

  syncConfig() {
    ls.setItem('config', JSON.stringify(this.configs))
  }

  add(config: Config) {
    if (this.configMap[config.name]) {
      return {
        code: 500,
        msg: `服务${config.name}已存在`,
      }
    }
    this.configs.push(config)
    this.syncConfig()
    return {
      code: 200,
      msg: 'ok',
    }
  }

  get configMap() {
    return this.configs.reduce((res, item) => {
      res[item.name] = item
      return res
    }, {} as Record<string, Config>)
  }

  getConfig(name: string) {
    return this.configMap[name]
  }

  start(name: string) {
    return new Promise((resolve) => {
      const config = this.getConfig(name)
      if (!config) {
        return resolve({
          code: 500,
          msg: `服务${name}不存在`,
        })
      }

      if (config.active) {
        return resolve({
          code: 500,
          msg: `服务${name}已启动`,
        })
      }

      const { command, args, path } = config
      let isResolve = false

      const ls = spawn(command, args ? args.split(' ') : [], {
        cwd: path,
      })

      this.cache.set(name, ls)
      this.log.set(name, [])

      ls.stdout.on('data', (data) => {
        if (!isResolve) {
          isResolve = true
          config.active = true
          this.syncConfig()
          resolve({
            code: 200,
          })
        }
        if (!this.log.has(name)) {
          this.log.set(name, [])
        }
        const log = this.log.get(name)
        log.push(data.toString())
      })

      ls.stderr.on('data', (data) => {
        if (!isResolve) {
          isResolve = true
          config.active = false
          this.syncConfig()
          resolve({
            code: 500,
            msg: data.toString(),
          })
        }
      })

      ls.on('close', (code) => {
        config.active = false
        this.cache.delete(name)
        this.syncConfig()
      })

      ls.on('error', (err) => {
        resolve({
          code: 500,
          msg: '命令执行错误',
        })
      })
    })
  }

  stop(name: string) {
    const config = this.getConfig(name)
    if (!config) {
      return {
        code: 500,
        msg: `服务${name}不存在`,
      }
    }
    if (!config.active) {
      return {
        code: 500,
        msg: `服务${name}未启动`,
      }
    }
    const ls = this.cache.get(name)
    if (ls) {
      const res = ls.kill()
      if (res) {
        config.active = false
        this.cache.delete(name)
        this.log.delete(name)
        this.syncConfig()
        return {
          code: 200,
          msg: 'ok',
        }
      } else {
        return {
          code: 500,
          msg: `服务${name}停止失败`,
        }
      }
    } else {
      // 如果ls不存在，但config.active为true，说明进程已意外终止，直接将active设为false
      if (config.active) {
        config.active = false
        this.syncConfig()
        return {
          code: 200,
          msg: `服务${name}进程已意外终止，已更新状态`,
        }
      }
      return {
        code: 500,
        msg: `服务${name}进程不存在`,
      }
    }
  }

  restart(name: string) {
    this.stop(name)
    this.start(name)
  }

  remove(name: string) {
    const idx = this.configs.findIndex((item) => item.name == name)
    if (idx === -1) {
      return {
        code: 500,
        msg: `服务${name}不存在`,
      }
    }
    this.configs.splice(idx, 1)
    this.cache.delete(name)
    this.log.delete(name)
    this.syncConfig()
    return {
      code: 200,
      msg: 'ok',
    }
  }

  modify(name: string, config: Config) {
    const _config = this.configMap[name]
    Object.assign(_config, config)
    return {
      code: 200,
      msg: 'ok',
    }
  }
}
