# `stdlib` 

## Overview

Testing best way to support cjs and esm and how to structure project to enable that (see results.txt for more info)

## Decision

> source: https://backstage.io/docs/architecture-decisions/adrs-adr004

We will make each exported symbol traceable through index files all the way down to the root of the package, src/index.ts. Each index file will only re-export from its own immediate directory children, and only index files will have re-exports. This gives a file tree similar to this:

```
index.ts
components/index.ts
          /ComponentX/index.ts
                     /ComponentX.tsx
                     /SubComponentY.tsx
lib/index.ts
   /UtilityX/index.ts
            /UtilityX.ts
            /helper.ts
```          

To check whether for example SubComponentY is exported from the package, it should be possible to traverse the index files towards the root, starting at the adjacent one. If there is any index file that doesn't export the previous one, the symbol is not publicly exported. For example, if components/ComponentX/index.ts exports SubComponentY, but components/index.ts does not re-export ./ComponentX, one should be certain that SubComponentY is not exported outside the package. This rule would be broken if for example the root index.ts re-exports ./components/ComponentX

In addition, index files that are re-exporting other index files should always use wildcard form, that is:

```typescript
// in components/index.ts
export * from './ComponentX';
```

Index files that are re-exporting symbols from non-index files should always enumerate all exports, that is:

```typescript
// in components/ComponentX/index.ts
export { ComponentX } from './ComponentX';
export type { ComponentXProps } from './ComponentX';
```

Internal cross-directory imports are allowed from non-index modules to index modules, for example:

```typescript
// in components/ComponentX/ComponentX.tsx
import { UtilityX } from '../../lib/UtilityX';
```
Imports that bypass an index file are discouraged, but may sometimes be necessary, for example:

```typescript
// in components/ComponentX/ComponentX.tsx
import { helperFunc } from '../../lib/UtilityX/helper';
```
