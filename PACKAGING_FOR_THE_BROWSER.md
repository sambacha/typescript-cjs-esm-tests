## manifest

```json
{
  "sideEffects": false,
  "type": "module",
  "main": "index.js",
  "types": "index.d.ts",
  "browser": {
    "./lib/lib1.js": "./lib/lib1.browser.js",
    "./lib/lib2.js": "./lib/lib2.browser.js",
    "./lib/lib3.js": "./lib/lib3.browser.js"
  },
  "react-native": {
    "./lib/lib1.js": "./lib/lib1.browser.js",
    "./lib/lib2.js": "./lib/lib2.browser.js",
    "./lib/lib3.js": "./lib/lib3.browser.js"
  },
  "files": [
    "lib/",
    "index.d.ts",
    "index.js"
  ]
}
```

## types


```typescript
/// <reference types="@types/node/events" />
import { EventEmitter } from "node:events";
export declare class EventEmitterWrapper implements EventEmitter {
    private readonly _wrapped;
    constructor(_wrapped: EventEmitter);
    addListener(event: string | symbol, listener: (...args: any[]) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    once(event: string | symbol, listener: (...args: any[]) => void): this;
    prependListener(event: string | symbol, listener: (...args: any[]) => void): this;
    prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
    off(event: string | symbol, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string | symbol | undefined): this;
    setMaxListeners(n: number): this;
    getMaxListeners(): number;
    listeners(event: string | symbol): Function[];
    rawListeners(event: string | symbol): Function[];
    emit(event: string | symbol, ...args: any[]): boolean;
    eventNames(): Array<string | symbol>;
    listenerCount(type: string | symbol): number;
}
```

## rollup types

```typescript 
import { EventEmitter } from 'node:events';
declare class EventEmitterWrapper implements EventEmitter {
    private readonly _wrapped;
    constructor(_wrapped: EventEmitter);
    addListener(event: string | symbol, listener: (...args: any[]) => void): this;
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    once(event: string | symbol, listener: (...args: any[]) => void): this;
    prependListener(event: string | symbol, listener: (...args: any[]) => void): this;
    prependOnceListener(event: string | symbol, listener: (...args: any[]) => void): this;
    removeListener(event: string | symbol, listener: (...args: any[]) => void): this;
    off(event: string | symbol, listener: (...args: any[]) => void): this;
    removeAllListeners(event?: string | symbol | undefined): this;
    setMaxListeners(n: number): this;
    getMaxListeners(): number;
    listeners(event: string | symbol): Function[];
    rawListeners(event: string | symbol): Function[];
    emit(event: string | symbol, ...args: any[]): boolean;
    eventNames(): Array<string | symbol>;
    listenerCount(type: string | symbol): number;
}
export { EventEmitterWrapper };
```
