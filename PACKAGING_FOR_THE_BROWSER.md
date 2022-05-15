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


> source: [https://devblogs.microsoft.com/typescript/announcing-typescript-4-5-beta/](https://devblogs.microsoft.com/typescript/announcing-typescript-4-5-beta/)

```jsonc
// package.json
{
    "name": "my-package",
    "type": "module",
    "exports": {
        ".": {
            // Entry-point for `import "my-package"` in ESM
            "import": "./esm/index.js",

            // Entry-point for `require("my-package") in CJS
            "require": "./commonjs/index.cjs",

            // Entry-point for TypeScript resolution
            "types": "./types/index.d.ts"
        },
    },

    // CJS fall-back for older versions of Node.js
    "main": "./commonjs/index.cjs",

    // Fall-back for older versions of TypeScript
    "types": "./types/index.d.ts"
}
```

```json
{
 "dependencies": {
    "@typescript/lib-dom": "npm:@types/web"
  }
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
