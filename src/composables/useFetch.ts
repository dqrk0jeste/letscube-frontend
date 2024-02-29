import { ref, type Ref } from 'vue'
import { ofetch } from 'ofetch'

type UseFetchReturn<T> = {
  data: Ref<T | undefined>,
  error: Ref<any>,
  pending: Ref<boolean>,
  refresh: () => void
}

type UseFetchError = {
  error: any,
  failedToFetch: boolean,
  statusCode?: number,
}

interface UseFetchOptions<T> extends RequestInit {
  onSuccess?: (data: T) => void,
  onError?: (error: UseFetchError) => void,
}

export default function useFetch<T>(url: string, options?: UseFetchOptions<T>): UseFetchReturn<T> {
  const data = ref<T>()
  const error = ref<UseFetchError>()
  const pending = ref<boolean>(true)

  function _fetch() {
    data.value = undefined
    error.value = undefined
    pending.value = true

    fetch(url, options)
      .then((res) => {
        if(!res.ok) {
          error.value = {
            error: new Error('bad status code'),
            failedToFetch: false,
            badStatusCode: true,
            statusCode: res.status,
          }
          if(options?.onError) {
            options.onError(error.value)
          }
        }
        const contentLength = res.headers.get('Content-Length')
        const contentType = res.headers.get('Content-Type')
        if(contentLength && parseInt(contentLength) !== 0 && contentType === 'application/json') {
          return res.json()
        }
      })
      .then((parsed) => {
        data.value = parsed
        if(!error.value && options?.onSuccess) {
          options?.onSuccess(data.value as T)
        }
      })
      .catch((e) => {
        error.value = {
          error: e,
          failedToFetch: true,
          badStatusCode: false,
        }
        if(options?.onError) {
          options.onError(error.value)
        }
      })
      .finally(() => {
        pending.value = false
      })
  }

  _fetch()

  return { data, error, pending, refresh: _fetch }
}