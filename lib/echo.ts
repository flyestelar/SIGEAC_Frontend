import './echo-events';

import { configureEcho } from '@laravel/echo-react';
import Pusher from 'pusher-js';
import axiosInstance from './axios';
export function setupEchoReverb(token: string | null = null) {
  if (typeof window !== 'undefined') window.Pusher = Pusher;

  configureEcho({
    broadcaster: 'reverb',
    key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
    wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
    wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT) || 8443,
    wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT) || 8443,
    forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    authEndpoint: `${process.env.NEXT_PUBLIC_API_BASE_URL}/broadcasting/auth`,
    authorizer: (channel, options) => {
      return {
        authorize: (socketId, callback) => {
          axiosInstance
            .post(
              options.authEndpoint,
              {
                socket_id: socketId,
                channel_name: channel.name,
              },
              {
                headers: {
                  Accept: 'application/json',
                  Authorization: token ? `Bearer ${token}` : undefined,
                },
              },
            )
            .then((response) => {
              callback(null, response.data);
            })
            .catch((error) => {
              callback(error, null);
            });
        },
      };
    },
  });
}
