# `stdlib` 

## Overview

Testing best way to support cjs and esm and how to structure project to enable that (see results.txt for more info)


## Avoid Default Exports and Prefer Named Exports'

### Context

When CommonJS was the primary authoring format, the best practice was to export only one thing from a module using the module.exports = ... format. This aligned with the UNIX philosophy of "Do one thing well". The module would be consumed (const localName = require('the-module');) without having to know the internal structure.

Now, ESModules are the primary authoring format. They have numerous benefits, such as compile-time verification of exports, and standards-defined semantics. They have a similar mechanism known as "default exports", which allows for a consumer to import localName from 'the-module';. This is implicitly the same as `import { default as localName } from 'the-module';`.

However, there are numerous reasons to avoid default exports, as documented by others before:

> NOTE. https://humanwhocodes.com/blog/2019/01/stop-using-default-exports-javascript-module/

### Summary

They add indirection by encouraging a developer to create local names for modules, increasing cognitive load and slowing down code comprehension: import TheListThing from 'not-a-list-thing';.
- They thwart tools, such as IDEs, that can automatically rename and refactor code.
- They promote typos and mistakes, as the imported member is completely up to the consuming developer to define.
- They are ugly in CommonJS interop, as the default property must be manually specified by the consumer. This is often hidden by Babel's module interop.
- They break re-exports due to name conflicts, forcing the developer to manually name each.
- Using named exports helps prevent needing to rename symbols, which has myriad benefits. A few are:

  IDE tools like "Find All References" and "Go To Definition" function
  Manual codebase searching ("grep", etc) is easier with a unique symbol

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




## Avoid Export Default - TypeScript Deep Dive

> [source https://basarat.gitbook.io/typescript/main-1/defaultisbad](https://basarat.gitbook.io/typescript/main-1/defaultisbad)

> Consider you have a file foo.ts with the following contents:


Consider you have a file `foo.ts` with the following contents:

You would import it (in `bar.ts`) using ES6 syntax as follows:

There are a few maintainability concerns here:

-   If you refactor `Foo` in `foo.ts` it will not rename it in `bar.ts`.
    

-   If you end up needing to export more stuff from `foo.ts` (which is what many of your files will have) then you have to juggle the import syntax.
    

For this reason I recommend simple exports + destructured import. E.g. `foo.ts`:

import { Foo } from "./foo";

Below I also present a few more reasons.

### Poor Discoverability

Discoverability is very poor for default exports. You cannot explore a module with intellisense to see if it has a default export or not.

With export default you get nothing here (maybe it does export default / maybe it doesn't `¯\_(ツ)_/¯`):

```typescript
import /\* here \*/ from 'something';
```
Without export default you get a nice intellisense here:

```typescript
import { /\* here \*/ } from 'something';
```

### Autocomplete

Irrespective of if you know about the exports, you even autocomplete at this `import {/*here*/} from "./foo";` cursor location. Gives your developers a bit of wrist relief.

### CommonJS interop

With `default` there is horrible experience for commonJS users who have to `const {default} = require('module/foo');` instead of `const {Foo} = require('module/foo')`. You will most likely want to rename the `default` export to something else when you import it.

### Typo Protection

You don't get typos like one dev doing `import Foo from "./foo";` and another doing `import foo from "./foo";`

### TypeScript auto-import

Auto import quickfix works better. You use `Foo` and auto import will write down `import { Foo } from "./foo";` cause its a well-defined name exported from a module. Some tools out there will try to magic read and _infer_ a name for a default export but magic is flaky.

### Re-exporting

Re-exporting is common for the root `index` file in npm packages, and forces you to name the default export manually e.g. `export { default as Foo } from "./foo";` (with default) vs. `export * from "./foo"` (with named exports).

### Dynamic Imports

Default exports expose themselves badly named as `default` in dynamic `import`s e.g.

```typescript
const HighCharts \= await import('https://code.highcharts.com/js/es-modules/masters/highcharts.src.js');

HighCharts.default.chart('container', { ... }); // Notice \`.default\`
```
Much nicer with named exports:
```typescript
const {HighCharts} \= await import('https://code.highcharts.com/js/es-modules/masters/highcharts.src.js');

HighCharts.chart('container', { ... }); // Notice \`.default\`
```

### Needs two lines for non-class / non-function

Can be one statement for function / class e.g.

```typescript
export default function foo() {
}
```

Can be one statement for _non named / type annotated_ objects e.g.:


```typescript
export default {
  notAFunction: 'Yeah, I am not a function or a class',
  soWhat: 'The export is now *removed* from the declaration'
};
```

But needs two statements otherwise:

```typescript
// If you need to name it (here \`foo\`) for local use OR need to annotate type (here \`Foo\`)

notAFunction: 'Yeah, I am not a function or a class',

soWhat: 'The export is now \*removed\* from the declaration'
};
export default foo;
```
