import axios, { type AxiosRequestConfig } from 'axios'

export type Response<T = any> = {
  code: number
  data: T
  msg: string
}

const instance = axios.create({
  baseURL: import.meta.env.VITE_APP_API,
})

instance.interceptors.response.use(
  (response) => {
    if (response.data.code == 200) {
      return response.data
    } else {
      ElMessage.error(response.data.msg)
      return Promise.reject(response.data)
    }
  },
  (err) => {
    return Promise.reject(err)
  },
)

export const http = instance

type TryResult<T> = [null, T] | [Error, null]

export const try_http = async <T = any>(config: AxiosRequestConfig): Promise<TryResult<Response<T>>> => {
  try {
    const res = await http<T>(config)
    return [null, res] as any
  } catch (err) {
    return [err, null] as any
  }
}
