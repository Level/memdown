import { AbstractLevelDOWN } from 'abstract-leveldown';

export interface MemDown<K=any, V=any>
  extends AbstractLevelDOWN<K, V, {}, {}, MemDownGetOptions, {}, MemDownIteratorOptions, {}> {
}

interface MemDownConstructor {
  new <K=any, V=any>(): MemDown<K, V>;
  <K=any, V=any>(): MemDown<K, V>;
}

export interface MemDownGetOptions {
  asBuffer?: boolean;
}

export interface MemDownIteratorOptions {
  keyAsBuffer?: boolean;
  valueAsBuffer?: boolean;
}

declare const MemDown: MemDownConstructor;
export default MemDown;
