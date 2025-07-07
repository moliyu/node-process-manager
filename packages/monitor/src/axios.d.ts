import { AxiosRequestConfig } from "axios";
import { Response } from "./utils/http";
declare module "axios" {
  export interface AxiosInstance {
    <T = any>(config: AxiosRequestConfig): Promise<Response<T>>;
    request<T = any>(config: AxiosRequestConfig): Promise<Response<T>>;
    get<T = any>(
      url: string,
      config?: AxiosRequestConfig,
    ): Promise<Response<T>>;
    delete<T = any>(
      url: string,
      config?: AxiosRequestConfig,
    ): Promise<Response<T>>;
    head<T = any>(
      url: string,
      config?: AxiosRequestConfig,
    ): Promise<Response<T>>;
    post<T = any>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig,
    ): Promise<Response<T>>;
    put<T = any>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig,
    ): Promise<Response<T>>;
    patch<T = any>(
      url: string,
      data?: any,
      config?: AxiosRequestConfig,
    ): Promise<Response<T>>;
  }
}
