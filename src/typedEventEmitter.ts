export interface TypedEventEmitter<TEventMap> {
  on<K extends keyof TEventMap>(
    event: K,
    handler: (detail: TEventMap[K]) => void,
  ): () => void
}

type ListenerBucket<TEventMap, K extends keyof TEventMap> = Set<(detail: TEventMap[K]) => void>
type ListenerMap<TEventMap> = Partial<{ [K in keyof TEventMap]: ListenerBucket<TEventMap, K> }>

export function createTypedEventEmitter<TEventMap>(): TypedEventEmitter<TEventMap> & {
  emit<K extends keyof TEventMap>(event: K, detail: TEventMap[K]): void
} {
  const listeners: ListenerMap<TEventMap> = {}

  function getListeners<K extends keyof TEventMap>(event: K): ListenerBucket<TEventMap, K> {
    let bucket = listeners[event] as ListenerBucket<TEventMap, K> | undefined
    if (!bucket) {
      bucket = new Set<(detail: TEventMap[K]) => void>()
      listeners[event] = bucket as ListenerMap<TEventMap>[K]
    }
    return bucket
  }

  return {
    on(event, handler) {
      const bucket = getListeners(event)
      bucket.add(handler)
      return () => { bucket.delete(handler) }
    },
    emit(event, detail) {
      const bucket = listeners[event] as ListenerBucket<TEventMap, typeof event> | undefined
      bucket?.forEach(handler => handler(detail))
    },
  }
}
