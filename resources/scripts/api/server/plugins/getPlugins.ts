import http from "@/api/http"

export interface Plugin {
  id: number
  name: string
  tag: string
  likes: number
  downloads: number
  description?: string
  releaseDate?: number
  rating?: {
    count: number
    average: number
  }
}

export interface PluginResponse {
  success: boolean
  data: {
    plugins: Plugin[]
    pagination?: {
      page: number
      limit: number
      total: number
    }
  }
  errors?: Record<string, string>
}

export default async (uuid: string, query: string, page = 1, limit = 20): Promise<PluginResponse> => {
  try {
    const { data } = await http.post<PluginResponse>(`/api/client/servers/${uuid}/plugins`, {
      query,
      page,
      limit,
    })

    // Validate response structure
    if (!data.success || !data.data.plugins) {
      throw new Error("Invalid response structure from server")
    }

    return data
  } catch (error) {
    // Return error response with proper structure
    return {
      success: false,
      data: {
        plugins: [],
        pagination: {
          page,
          limit,
          total: 0,
        },
      },
      errors: {
        api: error instanceof Error ? error.message : "Failed to fetch plugins",
      },
    }
  }
}
