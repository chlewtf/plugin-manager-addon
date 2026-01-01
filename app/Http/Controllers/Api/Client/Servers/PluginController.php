<?php

namespace Pterodactyl\Http\Controllers\Api\Client\Servers;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Pterodactyl\Models\Server;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Http\Controllers\Api\Client\ClientApiController;
use Pterodactyl\Http\Requests\Api\Client\Servers\Files\PullFileRequest;

class PluginController extends ClientApiController
{
    /**
     * @var \Pterodactyl\Repositories\Wings\DaemonFileRepository
     */
    private $fileRepository;

    /**
     * Base URL for Spigot API with improved error handling
     */
    private const SPIGOT_API_URL = 'https://api.spiget.org/v2/search/resources';
    private const SPIGOT_CDN_URL = 'https://cdn.spiget.org/file/spiget-resources';
    private const REQUEST_TIMEOUT = 10;
    private const MAX_RESULTS = 50;

    /**
     * PluginController constructor.
     * 
     * @param \Pterodactyl\Repositories\Wings\DaemonFileRepository $fileRepository
     */
    public function __construct(DaemonFileRepository $fileRepository)
    {
        parent::__construct();
        $this->fileRepository = $fileRepository;
    }

    /**
     * Search for plugins from the Spigot API.
     * 
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     * 
     * @throws \Pterodactyl\Exceptions\DisplayException
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->input('query');
        $page = max(1, (int) $request->input('page', 1));
        $limit = min(50, max(1, (int) $request->input('limit', 20)));

        if (empty(trim($query))) {
            return new JsonResponse([
                'success' => false,
                'errors' => [
                    'query' => 'Search query is required and cannot be empty.',
                ],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (strlen($query) > 255) {
            return new JsonResponse([
                'success' => false,
                'errors' => [
                    'query' => 'Search query must not exceed 255 characters.',
                ],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $client = new Client([
                'timeout' => self::REQUEST_TIMEOUT,
                'connect_timeout' => 5,
            ]);

            $url = self::SPIGOT_API_URL . '/' . urlencode($query) . '?page=' . $page . '&size=' . $limit;

            $response = $client->request('GET', $url, [
                'headers' => [
                    'User-Agent' => 'Pterodactyl-Plugin-Manager/2.0',
                    'Accept' => 'application/json',
                ],
            ]);

            $plugins = json_decode($response->getBody(), true);

            if (!is_array($plugins)) {
                throw new DisplayException('Invalid response format from Spigot API.');
            }

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'plugins' => $plugins,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => count($plugins),
                    ],
                ],
            ]);
        } catch (GuzzleException $e) {
            return new JsonResponse([
                'success' => false,
                'errors' => [
                    'api' => 'Failed to connect to Spigot API. Please try again later.',
                ],
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'errors' => [
                    'error' => 'An unexpected error occurred while searching for plugins.',
                ],
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Install a plugin to the server.
     * 
     * @param \Pterodactyl\Http\Requests\Api\Client\Servers\Files\PullFileRequest $request
     * @param \Pterodactyl\Models\Server $server
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     * 
     * @throws \Pterodactyl\Exceptions\DisplayException
     */
    public function install(PullFileRequest $request, Server $server, int $id): JsonResponse
    {
        if ($id <= 0) {
            return new JsonResponse([
                'success' => false,
                'errors' => [
                    'id' => 'Invalid plugin ID provided.',
                ],
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            $url = self::SPIGOT_CDN_URL . '/' . $id . '.jar';

            // Validate URL before attempting download
            $client = new Client(['timeout' => 30]);
            $headResponse = $client->head($url, [
                'headers' => [
                    'User-Agent' => 'Pterodactyl-Plugin-Manager/2.0',
                ],
            ]);

            if ($headResponse->getStatusCode() !== 200) {
                throw new DisplayException('Plugin file not found on Spigot CDN.');
            }

            // Proceed with file pull
            $this->fileRepository->setServer($server)->pull(
                $url,
                '/plugins',
                $request->safe(['filename', 'use_header', 'foreground'])->all()
            );

            return new JsonResponse([], Response::HTTP_NO_CONTENT);
        } catch (DisplayException $e) {
            return new JsonResponse([
                'success' => false,
                'errors' => [
                    'plugin' => $e->getMessage(),
                ],
            ], Response::HTTP_BAD_REQUEST);
        } catch (GuzzleException $e) {
            return new JsonResponse([
                'success' => false,
                'errors' => [
                    'download' => 'Failed to download plugin. Please try again later.',
                ],
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'errors' => [
                    'error' => 'An unexpected error occurred while installing the plugin.',
                ],
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
