# `std.module.format` 

> version 0.1.0

- [`std.module.format`](#-stdmoduleformat-)
  * [Overview](#overview)
  * [TLDR](#tldr)
  * [Avoid Default Exports and Prefer Named Exports](#avoid-default-exports-and-prefer-named-exports)
    + [Context](#context)
    + [Summary](#summary)
  * [Decision](#decision)
    + [ECMAScript Module Support in Node.js](#ecmascript-module-support-in-nodejs)
    + [`.mjs`, `.cjs`, == `.mts`, `.cts` && `.d.mts` and `.d.cts`.](#-mjs----cjs-------mts----cts------dmts--and--dcts-)
  * [Avoid Export Default](#avoid-export-default)
    + [Poor Discoverability](#poor-discoverability)
    + [Autocomplete](#autocomplete)
    + [CommonJS interop](#commonjs-interop)
    + [Typo Protection](#typo-protection)
    + [TypeScript auto-import](#typescript-auto-import)
    + [Re-exporting](#re-exporting)
    + [Dynamic Imports](#dynamic-imports)
    + [Needs two lines for non-class / non-function](#needs-two-lines-for-non-class---non-function)
    + [React.js - Named Exports](#reactjs---named-exports)
  * [{} type](#---type)
    + [If you want a type that means "empty object"](#if-you-want-a-type-that-means--empty-object-)
    + [If you are using React, and you want to define `type Props = {}`.](#if-you-are-using-react--and-you-want-to-define--type-props------)
    + [`GenericObject`](#-genericobject-)
    + [Module-related host hooks](#module-related-host-hooks)

## Overview


Testing best way to support cjs and esm and how to structure project to enable that (see results.txt for more info)

## TLDR

```javascript
(?<=(?:(?:import|require)\(|(?:import(?:\s|.)*from))\s*(?:\"|\'))(.*)(?=\"|\')
```
```javascript
// test file for regex above
import("./module")
import('./module')
require("./module")
require('./module')
import * as Namespace from "./module"
import Namespace from "./module"
import { variableOne } from "./module"
import { variableOne, variableTwo } from "./module"
import { 
  variableOne,
  variableTwo,
} from "./module"
import { variable as somethingElse } from "./module"
```

```javascript
// code generated 
const regex = /(?<=(?:(?:import|require)\(|(?:import(?:\s|.)*from))\s*(?:\"|\'))(.*)(?=\"|\')/gm;

// Alternative syntax using RegExp constructor
// const regex = new RegExp('(?<=(?:(?:import|require)\\(|(?:import(?:\\s|.)*from))\\s*(?:\\"|\\\'))(.*)(?=\\"|\\\')', 'gm')

const str = `import("./module")
import('./module')
require("./module")
require('./module')
import * as Namespace from "./module"
import Namespace from "./module"
import { variableOne } from "./module"
import { variableOne, variableTwo } from "./module"
import { 
  variableOne,
  variableTwo,
} from "./module"
import { variable as somethingElse } from "./module"
`;
let m;

while ((m = regex.exec(str)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
        regex.lastIndex++;
    }
    
    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
        console.log(`Found match, group ${groupIndex}: ${match}`);
    });
}
```

## Avoid Default Exports and Prefer Named Exports

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

### ECMAScript Module Support in Node.js

> source https://devblogs.microsoft.com/typescript/announcing-typescript-4-5-beta/

For the last few years, Node.js has been working to support running ECMAScript modules (ESM). This has been a very difficult feature to support, since the foundation of the Node.js ecosystem is built on a different module system called CommonJS (CJS). Interoperating between the two brings large challenges, with many new features to juggle; however, support for ESM in Node.js is now largely implemented in Node.js 12 and later, and the dust has begun to settle.

That’s why TypeScript 4.5 brings two new module settings: node12 and nodenext.
```json
{
    "compilerOptions": {
        "module": "nodenext",
    }
}
```

These new modes bring a few high-level features which we’ll explore here.

type in package.json and New Extensions
Node.js supports a new setting in package.json called type. "type" can be set to either "module" or "commonjs".
```json
{
    "name": "my-package",
    "type": "module",

    "//": "...",
    "dependencies": {
    }
}
```
### `.mjs`, `.cjs`, == `.mts`, `.cts` && `.d.mts` and `.d.cts`.

Node.js supports two extensions to help with this: `.mjs` and `.cjs`. `.mjs` files are always ES modules, and `.cjs` files are always CommonJS modules, and there’s no way to override these.

In turn, TypeScript supports two new source file extensions: .mts and `.cts`. When TypeScript emits these to JavaScript files, it will emit them to `.mjs` and `.cjs` respectively.

Furthermore, TypeScript also supports two new declaration file extensions: .d.mts and .d.cts. When TypeScript generates declaration files for `.mts` and `.cts`, their corresponding extensions will be `.d.mts` and `.d.cts`.

Using these extensions is entirely optional, but will often be useful even if you choose not to use them as part of your primary workflow.


## Avoid Export Default

> source:  TypeScript Deep Dive

> [source https://basarat.gitbook.io/typescript/main-1/defaultisbad](https://basarat.gitbook.io/typescript/main-1/defaultisbad)

> Consider you have a file foo.ts with the following contents:


Consider you have a file `foo.ts` with the following contents:

You would import it (in `bar.ts`) using ES6 syntax as follows:

There are a few maintainability concerns here:

-   If you refactor `Foo` in `foo.ts` it will not rename it in `bar.ts`.
    

-   If you end up needing to export more stuff from `foo.ts` (which is what many of your files will have) then you have to juggle the import syntax.
    

For this reason I recommend simple exports + destructured import. E.g. `foo.ts`:

```typescript
import { Foo } from "./foo";
```
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

### React.js - Named Exports

> [source, https://reactjs.org/docs/code-splitting.html#named-exports](https://reactjs.org/docs/code-splitting.html#named-exports)


React.lazy currently only supports default exports. If the module you want to import uses named exports, you can create an intermediate module that reexports it as the default. This ensures that tree shaking keeps working and that you don’t pull in unused components.

```javascript
// ManyComponents.js
export const MyComponent = /* ... */;
export const MyUnusedComponent = /* ... */;
```

```javascript
// MyComponent.js
export { MyComponent as default } from "./ManyComponents.js";
```

```javascript
// MyApp.js
import React, { lazy } from 'react';
const MyComponent = lazy(() => import("./MyComponent.js"));
```


## {} type

> [Below is copied from this comment, see https://github.com/typescript-eslint/typescript-eslint/issues/2063#issuecomment-675156492](https://github.com/typescript-eslint/typescript-eslint/issues/2063#issuecomment-675156492)

We will not be removing `{}` from the rule defaults, as it is an unsafe type because it doesn't work how people think it works, and in most cases it allows weakly typed code.

---

This is the exact reason that the rule bans the `{}` ***type***.
It's a common misconception that the `{}` ***type*** is the same as the `{}` ***value***.
But as the rule's message states: _this is not the case_!

The ***type*** `{}` doesn't mean "any empty object", it means "any non-nullish value".

This is obviously a huge type safety hole!

For example - the following code is _completely type-check valid_, even though it might make no sense to be:

```ts
interface AAA {
  aaa: {};
}

const x: AAA = { aaa: true };
```
[repl](https://www.typescriptlang.org/play/#code/JYOwLgpgTgZghgYwgAgILuQbwFDOXAgLiwF8BubE7bBAexAGcxkAPY9VZAXi3yOTBQArinLYgA)

[It's also important to note that empty interfaces behave in exactly the same way as the `{}` type!](https://www.typescriptlang.org/play?#code/JYOwLgpgTgZghgYwgAgILuQbwFDOXAgLmQCEyBubAX21ElkRTJKxuwQHsQBnMZAD2LpUyALxZ8RZGCgBXFFUpA), which is why we have the [`no-empty-interface`](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-empty-interface.md) lint rule.

----

Unfortunately, there's no _type_ in TS that means "an empty object".

There are the following options for you:

### If you want a type that means "empty object"

You can use a type similar to this type.

```ts
type EmptyObject = Record<string, never>; // or {[k: string]: never}

const a: EmptyObject = { a: 1 };  // expect error
const b: EmptyObject = 1;         // expect error
const c: EmptyObject = () => {};  // expect error
const d: EmptyObject = null;      // expect error
const e: EmptyObject = undefined; // expect error
const f: EmptyObject = {};        // NO ERROR - as expected
```
[ts playground repl](https://www.typescriptlang.org/play?#code/C4TwDgpgBAogtmUB5ARgKwgY2FAvFAJSwHsAnAEwB4BnYUgSwDsBzAGikYgDcJSA+ANwAoIZmKNaUAIYAuWAmTosOfAG9pcgIxQAvgKhQA9IagQAHpGynSpMqPGSUc+IhCoMV-Jv0Hfv46YWyta2pPYSOJjOCm5KnlAAFACUeHxQqnoGAeaWOLyh4ZLk0a7uwfiMAK4ANtU+ftlBVvl2YhGmJYoeKlCVjOQQAGZMEOT6jbkhrQ44g52x3XjpmX7+JgBySLAEBEgEUAC00tSBuaNCQA)

### If you are using React, and you want to define `type Props = {}`.

This is ***technically*** safe in this instance, [because under the hood the `{}` type is passed into an intersection type](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/6fd37a55773b23e00a19418d9b5aad912087c982/types/react/index.d.ts#L501) (see the note at the end of this comment for why this is safe).

However, there is no way for us to statically analyse and know that this is a safe usage.
To work around this, consider reconfiguring the lint rule to match your repository's coding style.
You can use the following config to allow it:

```json
{
  "rules": {
    "@typescript-eslint/ban-types": [
      "error",
      {
        "extendDefaults": true,
        "types": {
          "{}": false
        }
      }
    ]
  }
}
```

Consider using [an eslint overrides config](https://eslint.org/docs/user-guide/configuring#configuration-based-on-glob-patterns) to limit the scope of this change to just react component files, to help ensure you're keeping your codebase as safe as possible.

----

As an aside - it's worth noting that `{}` is a very weird anomaly in TypeScript, because there is just one case where it actually does mean something akin to "empty object"; in an intersection type.

```ts
type T1 = { a: 1 } & {};
const t11: T1 = { a: 1 };
const t12: T1 = true; // expected error

type T2 = true & {};
const t21: T2 = true;
const t22: T2 = false; // expected error
const t23: T2 = {}; // expected error

```
[repl](https://www.typescriptlang.org/play?#code/C4TwDgpgBAKgjFAvFA3lAhgLiggvlAMlVwG4AoAYwHsA7AZ2CmDjm3iVQ2z3OvseYAmNgmTAATgFcIJKAHo5UCAA9IFYBAAmS8eKriyZUJFiCOE6YWK9aDJoNanzUmZVsDBwp8gBm6ADZ0MvKKKmoa2hC6+m789gDMbGbIKKQhSqoQ6lo6egZAA)

In this usage, the type essentially is a no-op, and means nothing at all.

In all other usages, [including in the `extends` clause of a generic type parameter](https://www.typescriptlang.org/play?#code/GYVwdgxgLglg9mABMOcA8AVRBTAHlbMAEwGdEBvAXwD4AKABwEMAnRgWwC5EMBKCygFACUcWlGYhsPANzDUtAIwy5oqspG0wIADbaZiAPQGcuetmjYiOZszjMBQA), it means "anything non-nullish".

_Originally posted by @bradzacher in https://github.com/typescript-eslint/typescript-eslint/issues/2063#issuecomment-675156492_


### `GenericObject`

```typescript
/**
 * Helper to avoid writing `Record<string, unknown>` everywhere you would usually use "object".
 *
 * @example (data: GenericObject) => void
 * @example variables: GenericObject<string>
 *
 * @see https://github.com/typescript-eslint/typescript-eslint/issues/2063#issuecomment-632833366
 */
export type GenericObject<T = unknown> = Record<string, T>;
```

###  Module-related host hooks

> [source, https://html.spec.whatwg.org/multipage/webappapis.html#integration-with-the-javascript-module-system](https://html.spec.whatwg.org/multipage/webappapis.html#integration-with-the-javascript-module-system)

> NOTE. Although the JavaScript specification speaks in terms of "scripts" versus "modules", in general this specification speaks in terms of classic scripts versus module scripts, since both of them use the script element.

The JavaScript specification defines a syntax for modules, as well as some host-agnostic parts of their processing model. This specification defines the rest of their processing model: how the module system is bootstrapped, via the `[script](https://html.spec.whatwg.org/multipage/scripting.html#the-script-element)` element with `[type](https://html.spec.whatwg.org/multipage/scripting.html#attr-script-type)` attribute set to "`module`", and how modules are fetched, resolved, and executed. [\[JAVASCRIPT\]](https://html.spec.whatwg.org/multipage/references.html#refsJAVASCRIPT)

Although the JavaScript specification speaks in terms of "scripts" versus "modules", in general this specification speaks in terms of [classic scripts](https://html.spec.whatwg.org/multipage/webappapis.html#classic-script) versus [module scripts](https://html.spec.whatwg.org/multipage/webappapis.html#module-script), since both of them use the `[script](https://html.spec.whatwg.org/multipage/scripting.html#the-script-element)` element.

`modulePromise = [import(specifier)](https://tc39.es/ecma262/#sec-import-calls)`

Returns a promise for the module namespace object for the [module script](https://html.spec.whatwg.org/multipage/webappapis.html#module-script) identified by specifier. This allows dynamic importing of module scripts at runtime, instead of statically using the `import` statement form. The specifier will be [resolved](https://html.spec.whatwg.org/multipage/webappapis.html#resolve-a-module-specifier) relative to the [active script](https://html.spec.whatwg.org/multipage/webappapis.html#active-script)'s [base URL](https://html.spec.whatwg.org/multipage/webappapis.html#concept-script-base-url).

The returned promise will be rejected if an invalid specifier is given, or if a failure is encountered while [fetching](https://html.spec.whatwg.org/multipage/webappapis.html#fetch-an-import()-module-script-graph) or [evaluating](https://html.spec.whatwg.org/multipage/webappapis.html#run-a-module-script) the resulting module graph.

This syntax can be used inside both [classic](https://html.spec.whatwg.org/multipage/webappapis.html#classic-script) and [module scripts](https://html.spec.whatwg.org/multipage/webappapis.html#module-script). It thus provides a bridge into the module-script world, from the classic-script world.

`url = [import.meta](https://tc39.es/ecma262/#sec-meta-properties) .url`

Returns the [active module script](https://html.spec.whatwg.org/multipage/webappapis.html#active-script)'s [base URL](https://html.spec.whatwg.org/multipage/webappapis.html#concept-script-base-url).

This syntax can only be used inside [module scripts](https://html.spec.whatwg.org/multipage/webappapis.html#module-script).

A module map is a [map](https://infra.spec.whatwg.org/#ordered-map) keyed by [tuples](https://infra.spec.whatwg.org/#tuple) consisting of a [URL record](https://url.spec.whatwg.org/#concept-url) and a [string](https://infra.spec.whatwg.org/#string). The [URL record](https://url.spec.whatwg.org/#concept-url) is the [request URL](https://fetch.spec.whatwg.org/#concept-request-url) at which the module was fetched, and the [string](https://infra.spec.whatwg.org/#string) indicates the type of the module (e.g. "`javascript`"). The [module map](https://html.spec.whatwg.org/multipage/webappapis.html#module-map)'s values are either a [module script](https://html.spec.whatwg.org/multipage/webappapis.html#module-script), null (used to represent failed fetches), or a placeholder value "`fetching`". [Module maps](https://html.spec.whatwg.org/multipage/webappapis.html#module-map) are used to ensure that imported module scripts are only fetched, parsed, and evaluated once per `[Document](https://html.spec.whatwg.org/multipage/dom.html#document)` or [worker](https://html.spec.whatwg.org/multipage/workers.html#workers).

Since [module maps](https://html.spec.whatwg.org/multipage/webappapis.html#module-map) are keyed by (URL, module type), the following code will create three separate entries in the [module map](https://html.spec.whatwg.org/multipage/webappapis.html#module-map), since it results in three different (URL, module type) [tuples](https://infra.spec.whatwg.org/#tuple) (all with "`javascript`" type):

```
import "https://example.com/module.mjs";
import "https://example.com/module.mjs#map-buster";
import "https://example.com/module.mjs?debug=true";
```

That is, URL [queries](https://url.spec.whatwg.org/#concept-url-query) and [fragments](https://url.spec.whatwg.org/#concept-url-fragment) can be varied to create distinct entries in the [module map](https://html.spec.whatwg.org/multipage/webappapis.html#module-map); they are not ignored. Thus, three separate fetches and three separate module evaluations will be performed.

In contrast, the following code would only create a single entry in the [module map](https://html.spec.whatwg.org/multipage/webappapis.html#module-map), since after applying the [URL parser](https://url.spec.whatwg.org/#concept-url-parser) to these inputs, the resulting [URL records](https://url.spec.whatwg.org/#concept-url) are equal:

```
import "https://example.com/module2.mjs";
import "https:example.com/module2.mjs";
import "https://///example.com\\module2.mjs";
import "https://example.com/foo/../module2.mjs";
```

So in this second example, only one fetch and one module evaluation will occur.

Note that this behavior is the same as how [shared workers](https://html.spec.whatwg.org/multipage/workers.html#sharedworker) are keyed by their parsed [constructor url](https://html.spec.whatwg.org/multipage/workers.html#concept-sharedworkerglobalscope-constructor-url).

Since module type is also part of the [module map](https://html.spec.whatwg.org/multipage/webappapis.html#module-map) key, the following code will create two separate entries in the [module map](https://html.spec.whatwg.org/multipage/webappapis.html#module-map) (the type is "`javascript`" for the first, and "`css`" for the second):

```
<script type=module>
  import "https://example.com/module";
</script>
<script type=module>
  import "https://example.com/module" assert { type: "css" };
</script>
```

This can result in two separate fetches and two separate module evaluations being performed. This is a [willful violation](https://html.spec.whatwg.org/multipage/introduction.html#willful-violation) of a constraint recommended (but not required) by the import assertions specification stating that each call to [HostResolveImportedModule](https://html.spec.whatwg.org/multipage/webappapis.html#hostresolveimportedmodule(referencingscriptormodule,-modulerequest)) with the same (referencingScriptOrModule, moduleRequest.\[\[Specifier\]\]) pair must return the same [Module Record](https://tc39.es/ecma262/#sec-source-text-module-records). [\[JSIMPORTASSERTIONS\]](https://html.spec.whatwg.org/multipage/references.html#refsJSIMPORTASSERTIONS)

In practice, due to the as-yet-unspecified memory cache (see issue [#6110](https://github.com/whatwg/html/issues/6110)) the resource may only be fetched once in WebKit and Blink-based browsers. Additionally, as long as all module types are mutually exclusive, the module type check in [fetch a single module script](https://html.spec.whatwg.org/multipage/webappapis.html#fetch-a-single-module-script) will fail for at least one of the imports, so at most one module evaluation will occur.

The purpose of including the type in the [module map](https://html.spec.whatwg.org/multipage/webappapis.html#module-map) key is so that an import with the wrong type assertion does not prevent a different import of the same specifier but with the correct type from succeeding.

JavaScript module scripts are the default import type when importing from another JavaScript module; that is, when an `import` statement lacks a `type` import assertion the imported module script's type will be JavaScript. Attempting to import a JavaScript resource using an `import` statement with a `type` import assertion will fail:

```
<script type="module">
    // All of the following will fail, assuming that the imported .mjs files are served with a
    // JavaScript MIME type. JavaScript module scripts are the default and cannot be imported with
    // any import type assertion.
    import foo from "./foo.mjs" assert { type: "javascript" };
    import foo2 from "./foo2.mjs" assert { type: "js" };
    import foo3 from "./foo3.mjs" assert { type: "" };
    await import("./foo4.mjs", { assert: { type: null } });
    await import("./foo5.mjs", { assert: { type: undefined } });
</script>
```

To resolve a module specifier given a [URL](https://url.spec.whatwg.org/#concept-url) base URL and a [string](https://infra.spec.whatwg.org/#string) specifier, perform the following steps. It will return either a [URL record](https://url.spec.whatwg.org/#concept-url) or failure.

1.  Apply the [URL parser](https://url.spec.whatwg.org/#concept-url-parser) to specifier. If the result is not failure, return the result.
    
2.  If specifier does not start with the character U+002F SOLIDUS (`/`), the two-character sequence U+002E FULL STOP, U+002F SOLIDUS (`./`), or the three-character sequence U+002E FULL STOP, U+002E FULL STOP, U+002F SOLIDUS (`../`), return failure.
    
    This restriction is in place so that in the future we can allow custom module loaders to give special meaning to "bare" import specifiers, like `import "jquery"` or `import "web/crypto"`. For now any such imports will fail, instead of being treated as relative URLs.
    
3.  Return the result of applying the [URL parser](https://url.spec.whatwg.org/#concept-url-parser) to specifier with base URL.
    

The following are valid module specifiers according to the above algorithm:

-   `https://example.com/apples.mjs`
-   `http:example.com\pears.js` (becomes `http://example.com/pears.js` as step 1 parses with no base URL)
-   `//example.com/bananas`
-   `./strawberries.mjs.cgi`
-   `../lychees`
-   `/limes.jsx`
-   `data:text/javascript,export default 'grapes';`
-   `blob:https://whatwg.org/d0360e2f-caee-469f-9a2f-87d5b0456f6f`

The following are valid module specifiers according to the above algorithm, but will invariably cause failures when they are [fetched](https://html.spec.whatwg.org/multipage/webappapis.html#fetch-a-single-module-script):

-   `javascript:export default 'artichokes';`
-   `data:text/plain,export default 'kale';`
-   `about:legumes`
-   `wss://example.com/celery`

The following are not valid module specifiers according to the above algorithm:

-   `https://eggplant:b/c`
-   `pumpkins.js`
-   `.tomato`
-   `..zucchini.mjs`
-   `.\yam.es`
