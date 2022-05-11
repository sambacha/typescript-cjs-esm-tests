# `stdlib` 

## Overview

Testing best way to support cjs and esm and how to structure project to enable that (see results.txt for more info)

> BELOW IS FROM TYPESCRIPT WIKI 

## Specification

```
"strictFunctionTypes": true, 
```
for List<T> we need to know the variance of the type parameter T. The compiler can only take full advantage of this potential speedup if the strictFunctionTypes flag is enabled



## Specifying Files

You should always make sure that your configuration files aren't including too many files at once.

Within a `tsconfig.json`, there are two ways to specify files in a project.

-   the `files` list
-   the `include` and `exclude` lists

The primary difference between the two is that `files` expects a list of file paths to source files, and `include`/`exclude` use globbing patterns to match against files.

While specifying `files` will allow TypeScript to quickly load up files up directly, it can be cumbersome if you have many files in your project without just a few top-level entry-points. Additionally, it's easy to forget to add new files to your `tsconfig.json`, which means that you might end up with strange editor behavior where those new files are incorrectly analyzed. All this can be cumbersome.

`include`/`exclude` help avoid needing to specify these files, but at a cost: files must be discovered by walking through included directories. When running through a _lot_ of folders, this can slow compilations down. Additionally, sometimes a compilation will include lots of unnecessary `.d.ts` files and test files, which can increase compilation time and memory overhead. Finally, while `exclude` has some reasonable defaults, certain configurations like mono-repos mean that a "heavy" folders like `node_modules` can still end up being included.

For best practices, we recommend the following:

-   Specify only input folders in your project (i.e. folders whose source code you want to include for compilation/analysis).
-   Don't mix source files from other projects in the same folder.
-   If keeping tests in the same folder as other source files, give them a distinct name so they can easily be excluded.
-   Avoid large build artifacts and dependency folders like `node_modules` in source directories.

Note: without an `exclude` list, `node_modules` is excluded by default; as soon as one is added, it's important to explicitly add `node_modules` to the list.

Here is a reasonable `tsconfig.json` that demonstrates this in action.

```js
{
    "compilerOptions": {
        // ...
    },
    "include": ["src"],
    "exclude": ["**/node_modules", "**/.*/"],
}
```

## Controlling `@types` Inclusion

By default, TypeScript automatically includes every `@types` package that it finds in your `node_modules` folder, regardless of whether you import it. This is meant to make certain things "just work" when using Node.js, Jasmine, Mocha, Chai, etc. since these tools/packages aren't imported - they're just loaded into the global environment.

Sometimes this logic can slow down program construction time in both compilation and editing scenarios, and it can even cause issues with multiple global packages with conflicting declarations, causing errors like

```
Duplicate identifier 'IteratorResult'.
Duplicate identifier 'it'.
Duplicate identifier 'define'.
Duplicate identifier 'require'.
```

In cases where no global package is required, the fix is as easy as specifying an empty field for [the `"types"` option](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html#types-typeroots-and-types) in a `tsconfig.json`/`jsconfig.json`

```js
// src/tsconfig.json
{
   "compilerOptions": {
       // ...

       // Don't automatically include anything.
       // Only include `@types` packages that we need to import.
       "types" : []
   },
   "files": ["foo.ts"]
}
```

If you still need a few global packages, add them to the `types` field.

```js
// tests/tsconfig.json
{
   "compilerOptions": {
       // ...

       // Only include `@types/node` and `@types/mocha`.
       "types" : ["node", "mocha"]
   },
   "files": ["foo.test.ts"]
}
```

## Incremental Project Emit

The `--incremental` flag allows TypeScript to save state from the last compilation to a `.tsbuildinfo` file. This file is used to figure out the smallest set of files that might to be re-checked/re-emitted since it last ran, much like how TypeScript's `--watch` mode works.

Incremental compiles are enabled by default when using the `composite` flag for project references, but can bring the same speed-ups for any project that opts in.

## Skipping `.d.ts` Checking

By default, TypeScript performs a full re-check of all `.d.ts` files in a project to find issues and inconsistencies; however, this is typically unnecessary. Most of the time, the `.d.ts` files are known to already work - the way that types extend each other was already verified once, and declarations that matter will be checked anyway.

TypeScript provides the option to skip type-checking of the `.d.ts` files that it ships with (e.g. `lib.d.ts`) using the `skipDefaultLibCheck` flag.

Alternatively, you can also enable the `skipLibCheck` flag to skip checking _all_ `.d.ts` files in a compilation.

These two options can often hide misconfiguration and conflicts in `.d.ts` files, so we suggest using them _only_ for faster builds.

## Using Faster Variance Checks

Is a list of dogs a list of animals? That is, is `List<Dog>` assignable to `List<Animals>`? The straightforward way to find out is to do a structural comparison of the types, member by member. Unfortunately, this can be very expensive. However, if we know enough about `List<T>`, we can reduce this assignability check to determining whether `Dog` is assignable to `Animal` (i.e. without considering each member of `List<T>`). (In particular, we need to know the [variance](https://en.wikipedia.org/wiki/Covariance_and_contravariance_(computer_science)) of the type parameter `T`.) The compiler can only take full advantage of this potential speedup if the `strictFunctionTypes` flag is enabled (otherwise, it uses the slower, but more lenient, structural check). For this reason, we recommend building with `--strictFunctionTypes` (which is enabled by default under `--strict`).

## Configuring Other Build Tools

TypeScript compilation is often performed with other build tools in mind - especially when writing web apps that might involve a bundler. While we can only make suggestions for a few build tools, ideally these techniques can be generalized.

Make sure that in addition to reading this section, you read up about performance in your choice of build tool - for example:

-   [ts-loader's section on _Faster Builds_](https://github.com/TypeStrong/ts-loader#faster-builds)
-   [awesome-typescript-loader's section on _Performance Issues_](https://github.com/s-panferov/awesome-typescript-loader/blob/master/README.md#performance-issues)

## Concurrent Type-Checking

Type-checking typically requires information from other files, and can be relatively expensive compared to other steps like transforming/emitting code. Because type-checking can take a little bit longer, it can impact the inner development loop - in other words, you might experience a longer edit/compile/run cycle, and this might be frustrating.

For this reason, some build tools can run type-checking in a separate process without blocking emit. While this means that invalid code can run before TypeScript reports an error in your build tool, you'll often see errors in your editor first, and you won't be blocked for as long from running working code.

An example of this in action is the [`fork-ts-checker-webpack-plugin`](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin) plugin for Webpack, or [awesome-typescript-loader](https://github.com/s-panferov/awesome-typescript-loader) which also sometimes does this.

## Isolated File Emit

By default, TypeScript's emit requires semantic information that might not be local to a file. This is to understand how to emit features like `const enum`s and `namespace`s. But needing to check _other_ files to generate the output for an arbitrary file can make emit slower.

The need for features that need non-local information is somewhat rare - regular `enum`s can be used in place of `const enum`s, and modules can be used instead of `namespace`s. For that reason, TypeScript provides the `isolatedModules` flag to error on features powered by non-local information. Enabling `isolatedModules` means that your codebase is safe for tools that use TypeScript APIs like `transpileModule` or alternative compilers like Babel.

As an example, the following code won't properly work at runtime with isolated file transforms because `const enum` values are expected to be inlined; but luckily, `isolatedModules` will tell us that early on.

```ts
// ./src/fileA.ts

export declare const enum E {
    A = 0,
    B = 1,
}

// ./src/fileB.ts

import { E } from "./fileA";

console.log(E.A);
//          ~
// error: Cannot access ambient const enums when the '--isolatedModules' flag is provided.
```

> **Remember:** `isolatedModules` doesn't automatically make code generation faster - it just tells you when you're about to use a feature that might not be supported. The thing you're looking for is isolated module emit in different build tools and APIs.

Isolated file emit can be leveraged by using the following tools:

-   [ts-loader](https://github.com/TypeStrong/ts-loader) provides [a `transpileOnly` flag](https://github.com/TypeStrong/ts-loader#transpileonly-boolean-defaultfalse) which performs isolated file emit by using `transpileModule`.
-   [awesome-typescript-loader](https://github.com/s-panferov/awesome-typescript-loader) provides [a `transpileOnly` flag](https://github.com/s-panferov/awesome-typescript-loader/blob/master/README.md#transpileonly-boolean) which performs isolated file emit by using `transpileModule`.
-   [TypeScript's `transpileModule` API](https://github.com/microsoft/TypeScript/blob/a685ac426c168a9d8734cac69202afc7cb022408/lib/typescript.d.ts#L5866) can be used directly.
-   [awesome-typescript-loader provides the `useBabel` flag](https://github.com/s-panferov/awesome-typescript-loader/blob/master/README.md#usebabel-boolean-defaultfalse).
-   [babel-loader](https://github.com/babel/babel-loader) compiles files in an isolated manner (but does not provide type-checking on its own).
-   [gulp-typescript](https://www.npmjs.com/package/gulp-typescript) enables isolated file emit when `isolatedModules` is enabled.
-   [rollup-plugin-typescript](https://github.com/rollup/rollup-plugin-typescript) _**only**_ performs isolated file compilation.
-   [ts-jest](https://kulshekhar.github.io/ts-jest/) can use be configured with the \[`isolatedModules` flag set to `true`\]isolatedModules: true(.
-   [ts-node](https://www.npmjs.com/package/ts-node) can detect [the `"transpileOnly"` option in the `"ts-node"` field of a `tsconfig.json`, and also has a `--transpile-only` flag](https://www.npmjs.com/package/ts-node#cli-and-programmatic-options).
