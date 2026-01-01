import http from "@/api/http"

export interface InstallResponse {
  success: boolean
  errors?: Record<string, string>
}

export default async (uuid: string, id: number): Promise<void> => {
  try {
    if (!id || id <= 0) {
      throw new Error("Invalid plugin ID")
    }

    await http.post(`/api/client/servers/${uuid}/plugins/install/${id}`)
  } catch (error) {
    // Re-throw with better error message
    if (error instanceof Error) {
      throw new Error(`Failed to install plugin: ${error.message}`)
    }
    throw new Error("Failed to install plugin: Unknown error")
  }
}
