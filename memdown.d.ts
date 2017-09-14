import * as Abstract from 'abstract-leveldown';

declare namespace memdown {
  export interface MemDown<TKey, TValue>
    extends Abstract.LevelDOWN<
    TKey,
    TValue,
    MemDownOptions,
    MemDownPutOptions,
    MemDownGetOptions,
    MemDownDeleteOptions,
    MemDownIteratorOptions<TKey, TValue>,
    MemDownBatchOptions> {
  }
  
  interface MemDownConstructor<TKey=any, TValue=any> {
    new(location: string): MemDown<TKey, TValue>;
    (location: string): MemDown<TKey, TValue>;
  }

  export interface MemDownOptions {
  }

  export interface MemDownPutOptions {
  }

  export interface MemDownGetOptions {
    asBuffer?: boolean;
  }

  export interface MemDownDeleteOptions {
  }

  export interface MemDownIteratorOptions<K, V> {
    gt?: K;
    gte?: K;
    lt?: K;
    lte?: K;
    reverse?: boolean;
    keys?: boolean;
    values?: boolean;
    limit?: number;
    keyAsBuffer?: boolean;
    valueAsBuffer?: boolean;
  }

  export interface MemDownBatchOptions {
  }
}

declare const memdown: memdown.MemDownConstructor & {
  clearGlobalStore(strict?: boolean);
  destroy(location: string, cb: () => void): void;
}

export = memdown;