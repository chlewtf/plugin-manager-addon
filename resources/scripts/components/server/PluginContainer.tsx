"use client"

import useSWR from "swr"
import { object, string } from "yup"
import useFlash from "@/plugins/useFlash"
import { ServerContext } from "@/state/server"
import { useEffect, useState } from "react"
import { Dialog } from "@/components/elements/dialog"
import { Button } from "@/components/elements/button"
import { Field, Form, Formik, type FormikHelpers } from "formik"
import TitledGreyBox from "@/components/elements/TitledGreyBox"
import FlashMessageRender from "@/components/FlashMessageRender"
import getPlugins, { type Plugin, type PluginResponse } from "@/api/server/plugins/getPlugins"
import ServerContentBlock from "@/components/elements/ServerContentBlock"
import installPlugin from "@/api/server/plugins/installPlugin"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCloudDownloadAlt, faExternalLinkAlt, faSearch, faSpinner } from "@fortawesome/free-solid-svg-icons"

interface Values {
  query: string
}

export default () => {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [installing, setInstalling] = useState(false)
  const { clearFlashes, addFlash, clearAndAddHttpError } = useFlash()
  const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid)

  const { data, error, isLoading } = useSWR<PluginResponse>(
    query ? [uuid, query, page, "/plugins"] : null,
    ([uuid, query, page]) => getPlugins(uuid, query, page),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    },
  )

  useEffect(() => {
    if (!error && !data?.errors) {
      clearFlashes("server:plugins")
    } else if (error || data?.errors) {
      const errorMsg = data?.errors?.api || "Failed to fetch plugins"
      addFlash({
        key: "server:plugins",
        type: "error",
        message: errorMsg,
      })
    }
  }, [error, data?.errors])

  const submit = ({ query }: Values, { setSubmitting }: FormikHelpers<Values>) => {
    if (query.trim().length === 0) {
      addFlash({
        key: "server:plugins",
        type: "warning",
        message: "Please enter a search query.",
      })
      setSubmitting(false)
      return
    }

    setQuery(query.trim())
    setPage(1)
    setSubmitting(false)
  }

  const doDownload = async () => {
    if (!selectedPlugin) return

    setInstalling(true)
    try {
      await installPlugin(uuid, selectedPlugin.id)
      addFlash({
        key: "server:plugins",
        type: "success",
        message: `Successfully installed ${selectedPlugin.name}. The server may need to be restarted.`,
      })
      setOpen(false)
      setSelectedPlugin(null)
    } catch (error) {
      clearAndAddHttpError({
        key: "server:plugins",
        error,
      })
    } finally {
      setInstalling(false)
    }
  }

  const openInstallDialog = (plugin: Plugin) => {
    setSelectedPlugin(plugin)
    setOpen(true)
  }

  const pluginsArray = data?.data?.plugins || []
  const pagination = data?.data?.pagination

  return (
    <ServerContentBlock title={"Plugins"} description={"Search and install Spigot plugins"}>
      <FlashMessageRender byKey={"server:plugins"} />
      <Formik
        onSubmit={submit}
        initialValues={{ query: "" }}
        validationSchema={object().shape({
          query: string().required("Search query is required").max(255, "Search query must not exceed 255 characters"),
        })}
      >
        {({ isSubmitting }) => (
          <Form>
            <div className={"grid grid-cols-12 mb-10 gap-2"}>
              <div className={"col-span-11"}>
                <Field
                  className={"p-2 bg-gray-600 w-full rounded border border-gray-500 focus:border-blue-500"}
                  name={"query"}
                  placeholder={"Search for a plugin"}
                  disabled={isSubmitting || isLoading}
                />
              </div>
              <Button type={"submit"} disabled={isSubmitting || isLoading} className={"flex items-center gap-2"}>
                {isSubmitting || isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Searching
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSearch} />
                    Search
                  </>
                )}
              </Button>
            </div>
          </Form>
        )}
      </Formik>

      {!query ? (
        <p className={"text-gray-400 text-center py-8"}>Enter a search query to find plugins...</p>
      ) : isLoading ? (
        <div className={"text-center py-8"}>
          <FontAwesomeIcon icon={faSpinner} spin className={"text-2xl text-blue-400"} />
          <p className={"text-gray-400 mt-2"}>Searching for plugins...</p>
        </div>
      ) : pluginsArray.length === 0 ? (
        <p className={"text-gray-400 text-center py-8"}>No plugins found for "{query}". Try a different search term.</p>
      ) : (
        <>
          <div className={"lg:grid lg:grid-cols-3 gap-2 p-2"}>
            {pluginsArray.map((plugin) => (
              <div key={plugin.id}>
                <Dialog.Confirm
                  open={open && selectedPlugin?.id === plugin.id}
                  onClose={() => {
                    setOpen(false)
                    setSelectedPlugin(null)
                  }}
                  title={`Install ${plugin.name}?`}
                  onConfirmed={doDownload}
                  disabled={installing}
                >
                  <p className={"mb-4"}>
                    Are you sure you want to install <strong>{plugin.name}</strong>?
                  </p>
                  {plugin.rating && (
                    <p className={"text-sm text-gray-400"}>
                      Rating: {plugin.rating.average.toFixed(1)}/5 ({plugin.rating.count} votes)
                    </p>
                  )}
                </Dialog.Confirm>

                <TitledGreyBox title={plugin.name} className={"m-2 h-full flex flex-col"}>
                  <div className={"flex-1 flex flex-col"}>
                    <p className={"text-sm mb-2"}>{plugin.tag || "No description"}</p>
                    <div className={"text-xs text-gray-400 space-y-1 mb-4"}>
                      <p>📥 {plugin.downloads?.toLocaleString() || 0} downloads</p>
                      {plugin.rating && <p>⭐ {plugin.rating.average.toFixed(1)}/5</p>}
                    </div>
                  </div>

                  <div className={"flex gap-2"}>
                    <Button className={"flex-1"} onClick={() => openInstallDialog(plugin)} disabled={installing}>
                      <FontAwesomeIcon icon={faCloudDownloadAlt} fixedWidth />
                      {installing && selectedPlugin?.id === plugin.id ? "Installing..." : "Install"}
                    </Button>
                    <a
                      href={`https://www.spigotmc.org/resources/${plugin.id}/`}
                      target={"_blank"}
                      rel={"noopener noreferrer"}
                    >
                      <Button>
                        <FontAwesomeIcon icon={faExternalLinkAlt} fixedWidth />
                      </Button>
                    </a>
                  </div>
                </TitledGreyBox>
              </div>
            ))}
          </div>

          {pagination && pagination.total >= pagination.limit && (
            <div className={"flex justify-center gap-4 mt-6"}>
              <Button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1 || isLoading}>
                Previous
              </Button>
              <span className={"text-gray-400 flex items-center"}>Page {page}</span>
              <Button onClick={() => setPage(page + 1)} disabled={isLoading}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </ServerContentBlock>
  )
}
