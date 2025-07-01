import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

export class ExternalService {
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
        console.error(
          "External API Error:",
          error.response?.data || error.message
        );
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    // Implement your token retrieval logic
    return process.env.API_TOKEN || null;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.httpClient.get(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.httpClient.post(
      url,
      data,
      config
    );
    return response.data;
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.httpClient.put(
      url,
      data,
      config
    );
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.httpClient.delete(
      url,
      config
    );
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.httpClient.patch(
      url,
      data,
      config
    );
    return response.data;
  }
}

export const externalService = new ExternalService();
