import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

export class RestApiSetup {
  private httpClient: AxiosInstance;

  constructor(baseURL?: string, timeout: number = 10000) {
    this.httpClient = axios.create({
      baseURL,
      timeout,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        // use global logger to keep consistency
        try {
          const { logger } = require("../utils/logger");
          logger.error({ err: error, data: error.response?.data }, "External API Error");
        } catch (_) {}
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    // Implement your token retrieval logic
    return process.env.API_TOKEN || null;
  }

  async get<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T, any>> {
    const response: AxiosResponse<T> = await this.httpClient.get(url, config);
    return response;
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T, any>> {
    const response: AxiosResponse<T> = await this.httpClient.post(
      url,
      data,
      config
    );
    return response;
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T, any>> {
    const response: AxiosResponse<T> = await this.httpClient.put(
      url,
      data,
      config
    );
    return response;
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T, any>> {
    const response: AxiosResponse<T> = await this.httpClient.delete(
      url,
      config
    );
    return response;
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T, any>> {
    const response: AxiosResponse<T> = await this.httpClient.patch(
      url,
      data,
      config
    );
    return response;
  }
}
