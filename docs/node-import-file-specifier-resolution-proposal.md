---
title: File Specifier Resolution in Node.js
source: https://github.com/GeoffreyBooth/node-import-file-specifier-resolution-proposal/commit/71e2b9676d49e44f096728ed6f1cd66cc6fa5c44
---

# File Specifier Resolution in Node.js

**Contributors**: Geoffrey Booth (@GeoffreyBooth), John-David Dalton (@jdalton), Jan Krems (@jkrems), Guy Bedford (@guybedford), Saleh Abdel Motaal (@SMotaal), Bradley Meck (@bmeck)

## TL;DR

In a hurry? Just read the [Proposal](#proposal) section.

## Motivating examples

- A project where all JavaScript is ESM.

- A project where all source is a transpiled language such as TypeScript or CoffeeScript.

- A project where some source is ESM and some is CommonJS.

- A package that aims to be imported into either a Node.js or a browser environment, without requiring a build step.

- A package that aims to be imported into either legacy Node environments as CommonJS or current Node environments as ESM.

## High level considerations

- The baseline behavior of relative imports should match a browser’s with a simple file server.

  This implies that `./x` will only ever import exactly the sibling file `"x"` without appending paths or extensions. `"x"` is never resolved to `x.mjs` or `x/index.mjs` (or the `.js` equivalents).

- As browsers support ESM in `import` statements of `.js` files, Node.js also needs to allow ESM in `import` statements of `.js` files.

  To be precise, browsers support ESM in files served via the MIME type `text/javascript`, which is the type associated with the `.js` extension and the MIME type served for `.js` files by all standard web servers.

  This is covered in summary in [nodejs/modules#149][nodejs/modules#149] with links to deeper discussions.

- Node also needs to allow ESM in `.js` files because transpiled languages such as CoffeeScript lack a way to use the file extension as a place to store metadata, the way `.mjs` does double duty both identifying the file as JavaScript and specifying an ESM parse goal.

  The only way CoffeeScript could do the same would be creating a new extension like `.mcoffee`, but this is impractical because of the scope of the ecosystem updates that would be required, with related packages like `gulp-coffee` and `coffee-loader` and so on needing updates.

  TypeScript has similar issues, though its situation is more complex because of its type definition files. This is covered in [nodejs/modules#150][nodejs/modules#150].

- Along with `.js` files needing to be able to contain ESM, they also still need to be able to contain CommonJS.

  We need to preserve CommonJS files’ ability to `require` CommonJS `.js` files, and ESM files need some way to import `.js` CommonJS files.

- This proposal only covers `import` statement specifiers; this doesn’t aim to also cover `--eval`, STDIN, command line flags, extensionless files or any of the other ways Node can import an entry point into a project or package.

  We intend to build on this proposal with a follow up to cover entry points.

## Real world data

As part of preparing this proposal, @GeoffreyBooth did [research][npm-packages-module-field-analysis] into public NPM registry packages using ESM syntax already, as identified by packages that define a `"module"` field in their `package.json` files. There are 941 such packages as of 2018-10-22.

A project was created with those packages `npm install`ed, creating a gigantic `node_modules` folder containing 96,923 JavaScript (`.js` or `.mjs`) files.

Code was then written to parse all of those JavaScript files with `acorn` and look for `import` or `export` declarations, and inspect the specifiers used in the `import` or `export ... from` statements. The [code for this][esm-npm-modules-research-code] is in this repo.

### Findings

#### &#x2002; 5,870 `import` statements imported ESM modules<sup>⑴</sup>, as bare specifiers, e.g. `import 'esm-module'`

#### &#x200a; 25,763 `import` statements imported CommonJS modules<sup>⑵</sup>, as bare specifiers, e.g. `import 'cjs-module'`

#### &#x2002; 1,564 `import` statements imported ESM files within packages e.g. `import 'esm-module/file'`

#### &#x2002; 8,140 `import` statements imported CommonJS files within packages, e.g. `import 'cjs-module/file'`

#### &#x200a; 86,001 `import` statements imported relative ESM JavaScript files<sup>⑶</sup>, e.g. `import './esm-file.mjs'`

#### &#x2002; 4,229 `import` statements imported relative CommonJS JavaScript files<sup>⑷</sup>, e.g. `import './cjs-file.js'`

<pre>
 ⑴  packages with a <samp>"module"</samp> field in their package.json.
 ⑵  packages lacking a <samp>"module"</samp> field in their package.json.
 ⑶  files with an <samp>import</samp> or <samp>export</samp> declaration.
 ⑷  files with a <samp>require</samp> call or references to <samp>module.exports</samp>, <samp>exports</samp>, <samp>\_\_filename</samp>, or <samp>\_\_dirname</samp>.
</pre>

## Note on default treatment of `.js` files

This proposal takes the position that `.js` should be treated as ESM by default within an ESM context. This differs from the default behavior of the Node 8-11 `--experimental-modules` implementation which treats `.js` files to be CommonJS sources and `.mjs` to be ESM.

The rationale behind this position is to move towards directions that can:

1. Improve interoperability with browsers where file extension does not affect how they interpret and load a JavaScript source.

2. Be forward-looking in that ESM is the standard and should therefore be the default behavior within ESM files, rather than something to be opted into.

As of this writing, there is no way to modify Node’s default behavior and affect if and when files with a `.js` (or any other) extension should be treated as ESM instead of CommonJS, or other source types, without having to use a special loader (eg `--loader` with `--experimental-modules` for the time being).

Two proposals (at least) were made to try to address this specifically through declarative fields in the `package.json`, affecting the handling of files within the scope of their respective package:

1. **[`"mode"`][nodejs/node/pull/18392]** proposes a `"mode": "esm"` field to force Node to treat all `.js` files as ESM sources.

2. **[`"mimes"`][nodejs/modules#160]** proposes a `"mimes": { … }` block which defines fine-grained mappings for any extension.

The research findings show that `import` statements of CommonJS `.js` files appear to be far less popular compared to imports of ESM `.js` files, which are 19 times more common. From this, we can make an assumption that users in general may be more inclined to “intuitively” prefer `import` statements of `.js` files to be used to import from ESM sources over CommonJS ones. However, it is also the position of the authors that the `.mjs` file extension should retain its current connotation to be by default always treated as an ESM source, unless otherwise reconfigured.

## Proposal

There are (at least) two parts to module resolution: _location_ and _interpretation._ Location is covered by the [resolver specification][nodejs/ecmascript-modules:esm.md#resolver-algorithm], and involves things like taking the specifier string `'underscore'` and finding its package entry point file `./node_modules/underscore/underscore.js`.

This proposal covers only the interpretation, or what Node should do once the file is found. For our purposes, interpretation means whether Node should load the package or file as ESM or as CommonJS.

This proposal only covers interpretation of files specified via `import` statements (e.g. `import './file.js'`) and via the `node` command (`node file.js`).

### `import` specifiers

There are four types of specifiers used in `import` statements or `import()` expressions:

- _Bare specifiers_ like `'lodash'`

  > They refer to an entry point of a package by the package name.

- _Deep import specifiers_ like `'lodash/lib/shuffle.mjs'`

  > They refer to a file within a package prefixed by the package name.

- _Relative file specifiers_ like `'./startup.js'` or `'../config.mjs'`

  > They refer to a file relative to the location of the importing file.

- _Absolute URL file specifiers_ like `'file:///opt/nodejs/config.js'`

  > They refer directly and explicity to a file by its location.

A central new concept used by many of the methods suggested in the proposal is the _package scope._

### Package scopes

A _package scope_ is a folder containing a `package.json` file and all of that folder’s subfolders except those containing another `package.json` file and _that_ folder’s subfolders. For example:

```
/usr/                        - outside any package scope
/usr/src/                    - outside any package scope

/usr/src/app/package.json    - in “app” package scope
/usr/src/app/index.js        - in “app” package scope
/usr/src/app/startup/init.js - in “app” package scope
/usr/src/app/node_modules/   - in “app” package scope

/usr/src/app/node_modules/sinon/package.json - in “sinon” package scope
/usr/src/app/node_modules/sinon/lib/sinon.js - in “sinon” package scope
```

The `package.json` files here each create a new package scope for the folder they’re in, and all subfolders down until another `package.json` file creates a new scope below. Thus `/usr/src/app/` and `/usr/src/app/node_modules/sinon/` are each root folders of separate package scopes.

Within a package scope, `package.json` files can hold metadata and configuration for the files contained within that scope. This proposal uses this concept to allow `package.json` values to opt in a package into being interpreted as ESM.

Package scopes apply only to files. While a user may execute code via `node --eval` from within a working directory of a particular package scope, that package scope has no effect on the source code passed in via `node --eval`.

### Package scope algorithm

After Node uses the algorithm in the [resolver specification][nodejs/ecmascript-modules:esm.md#resolver-algorithm] to locate a source code file to load, Node must then decide whether to load it as ESM or as CommonJS. If the source code file has an `.mjs` extension, Node is done; the file is loaded as ESM. Otherwise, Node needs to find the `package.json` governing the package scope that the file is in. That package scope algorithm goes as follows:

```
If the file is a package entry point
    And the package’s package.json says to load JavaScript as ESM
        Load the file as ESM.
    Else
        Load the file as CommonJS.
Else
    If there is a package.json in the folder where the file is
        And the package.json says to load JavaScript as ESM
            Load the file as ESM.
        Else
            Load the file as CommonJS.
    Else
        Go into the parent folder and look for a package.json there
        Repeat until we either find a package.json or hit the file system root
        If we found a package.json
            And the package.json says to load JavaScript as ESM
                Load the file as ESM.
            Else
                Load the file as CommonJS.
        Else we reach the file system root without finding a package.json
            Load the file as CommonJS if initial entry point, ESM otherwise.
```

The last case, when we reach the file system root without finding a `package.json`, covers files that are outside any package scope. If such files are the initial entry point, e.g. `node /usr/local/bin/backup.js`, they are parsed as CommonJS for backward compatibility. If such files are referenced via an `import` statement or `import()` expression, they are parsed as ESM.

### Parsing `package.json`

A `package.json` file is detected as ESM if it contains metadata that signifies ESM support, such as `"type": "module"`. For the purposes of this proposal we will refer to `"type"`, but in all cases that’s a placeholder for whichever `package.json` field or fields signify that a package exports ESM files.

A `package.json` file is detected as CommonJS by the _lack_ of an ESM-signifying field. A package may also export both ESM and CommonJS files; such packages’ files are loaded as ESM via `import` and as CommonJS via `require`.

### Example

```
 ├─ /usr/src/app/                        <- ESM package scope
 │    package.json {                        created by package.json with "type": "module"
 │      "type": "module"
 │    }
 │
 ├─ index.js                             <- parsed as ESM
 │
 ├─┬─ startup/
 │ │
 │ └─ init.js                            <- parsed as ESM
 │
 └─┬ node_modules/
   │
   ├─┬─ sinon/                           <- ESM package scope
   │ │    package.json {                    created by package.json with "type": "module"
   │ │      "type": "module"
   │ │      "main": "index.mjs"
   │ │    }
   │ │
   │ ├─┬─ dist/
   │ │ │
   │ │ ├─ index.mjs                      <- parsed as ESM
   │ │ │
   │ │ └─┬─ stub/
   │ │   │
   │ │   └─ index.mjs                    <- parsed as ESM
   │ │
   │ └─┬ node_modules/
   │   │
   │   └─┬ underscore/                   <- CommonJS package scope
   │     │   package.json {                 created by package.json with no "type" field
   │     │     "main": "underscore.js"
   │     │   }
   │     │
   │     └─ underscore.js                <- parsed as CommonJS
   │
   └─┬ request/                          <- CommonJS package scope
     │   package.json {                     created by package.json with no "type" field
     │     "main": "index.js"
     │   }
     │
     ├─ index.js                         <- parsed as CommonJS
     │
     └─┬─ lib/
       │
       └─ cookies.js                     <- parsed as CommonJS
```

The following `import` statements from the above `/usr/src/app/index.js` would parse as follows:

```js
// Package entry points
import sinon from 'sinon'; // ESM
import request from 'request'; // CommonJS

// Deep imports
import stub from 'sinon/stub/index.mjs'; // ESM
import cookies from 'request/lib/cookies.js'; // CommonJS

// File specifiers: relative
import './startup/init.js'; // ESM
import cookies from './node_modules/request/lib/cookies.js'; // CommonJS
import stub from './node_modules/sinon/dist/stub/index.mjs'; // ESM
import _ from './node_modules/sinon/node_modules/underscore/underscore.js'; // CommonJS

// File specifiers: absolute
import 'file:///usr/src/app/startup/init.js'; // ESM
import cookies from 'file:///usr/src/app/node_modules/request/lib/cookies.js'; // CommonJS
```

File extensions are still relevant. While either a `.js` or an `.mjs` file can be loaded as ESM, only `.js` files can be loaded as CommonJS. If the above example’s `cookies.js` was renamed `cookies.mjs`, the theoretical `import cookies from 'request/lib/cookies.mjs'` would still load as ESM as the `.mjs` extension is itself unambiguous.

The CommonJS automatic file extension resolution or folder `index.js` discovery are not supported for `import` statements, even when referencing files inside CommonJS packages. Both `import cookies from 'request/lib/cookies'` and `import request from './node_modules/request'` would throw. Automatic file extension resolution or folder `index.js` discovery _are_ still supported for `package.json` `"main"` field specifiers for CommonJS packages, however, to preserve backward compatibility.

### Initial entry point

It is outside the scope of this proposal to define how an ESM-supporting Node should determine the parse goal, ESM or CommonJS, for every type of input (file, string via `--eval`, string via `STDIN`, extensionless file, etc.). However, for the purposes of completeness for this proposal we will define _one_ method that we expect Node to support, with the understanding that additional methods will be necessary to handle the other use cases.

To preserve backward compatibility, we expect that `node file.js` will continue to load the entry point `file.js` as CommonJS by default. (This may be deprecated and eventually changed to an ESM default in the future, but certainly not in the initial release of Node with ESM support.) However, if `file.js` is inside an ESM package scope, Node should load `file.js` as ESM. So for example, if a [`package.json` with an ESM-signifying field](#parsing-packagejson) is in the same folder as `file.js`, `node file.js` would load `file.js` as ESM. The same “search up the file tree for a `package.json`” [algorithm](#procedure) for `import` statements applies when determining the package scope for `file.js`.

### Important Notes

- `import` specifiers starting with `/` or `//`

  These are currently unsupported but reserved for future use. Browsers support specifiers like `'/app.js'` to be relative to the base URL of the page, whereas in CommonJS a specifier starting with `/` refers to the root of the file system. We would like to find a solution that conforms Node closer to browsers for `/`-leading specifiers. That may not necessarily involve a leading `/`, for example if Node adopts the [`import:` proposal][import-urls] or something like it; but we would like to preserve design space for a future way to conveniently refer to the root of the current package.

- **`createRequireFromPath` in ESM**

  Packages or files located from `require` calls created via [`module.createRequireFromPath`][nodejs-docs-modules-create-require-from-path] are _always_ parsed as CommonJS, following how `require` behaves now.

- **“Dual mode” packages**

  It is outside the scope of this proposal to define the fields necessary in `package.json` to enable a single package to export both ESM and CommonJS entry points. We expect that a follow-on proposal will cover this use case.

- **Dual instantiation**

  The ESM and CommonJS interpretations of a module have independent storage. The same source module may be loaded as both an ESM version and a CommonJS version in the same application, in which case the module will be evaluated twice (once for each parse goal) and the resulting instances will **never** have the same identity. This means that whilst `import` and `import()` may return a CommonJS `exports` value for a module whose interpretation is confirmed to be CommonJS, `require()` will never return the ESM namespace object for a module whose interpretation is ESM.

  Applications that avoid `require()` and only rely on Node’s interpretation of a module, via `import` and `import()`, will never trigger simultaneous instantiation of both versions. With this proposal, the only way to encounter this dual-instantiation scenario is if some part of the application uses `import`/`import()` to load a module **and** some other part of the application overrides Node’s interpretation by using `require()` or  [`module.createRequireFromPath`][nodejs-docs-modules-create-require-from-path] to load that same module.

  The choice to allow dual-instantiation was made to provide well-defined determinstic behaviour.  Alternative behaviours, such as throwing a runtime exception upon encountering the scenario, were deemed brittle and likely to cause user frustration. Nevertheless, dual instantiation is not an encouraged pattern. Users should ideally avoid dual-instantiation by migrating consumers away from `require` to use `import` or `import()`.

#### Further Considerations

<details><summary>“Loose” CommonJS files (files outside of packages)</summary>

Currently, `module.createRequireFromPath` can be used to import CommonJS files that aren’t inside a CommonJS package scope. To import the file via an `import` statement, a symlink could also be created from inside a CommonJS package scope to the desired “loose” CommonJS file, or the file could simply be moved inside a CommonJS package scope. Seeing as there is low user demand for ESM files importing CommonJS files outside of CommonJS packages, we feel that these options are sufficient.

</details>

<details><summary>CommonJS files inside an ESM package scope</summary>

One of our use cases is a package in transition, for example that’s migrating from CommonJS to ESM but the migration is not yet complete. This raises the issue of both parse goals (ESM and CommonJS) existing within an ESM package scope; but `import` statements will always treat JavaScript files within such a scope as ESM.

One way to import such CommonJS files is to use `module.createRequireFromPath`; another would be to move the CommonJS files into or under a folder with an empty `package.json` file, which would create a CommonJS package scope. `import` statements of symlinks inside a CommonJS package scope could also be used.

Of course, perhaps the most straightforward solution would be for users transitioning a package to simply transpile with a tool like Babel, like they do now, until the migration is complete.

We feel that these options are sufficient for now, but if user demand grows such that we want to provide a way to use `import` statements to import CommonJS files that are in an ESM package scope, we have a few options:

1. We could introduce a `.cjs` extension that Node always interprets as JavaScript with a CommonJS parse goal, the mirror of `.mjs`. (This might be a good thing to add in any case, for design symmetry.) Users could then rename their CommonJS `.js` files to use `.cjs` extensions and import them via `import` statements. We could also support symlinks, so that a `foo.cjs` symlink pointing at `foo.js` would be treated as CommonJS when imported via `import './foo.cjs';`, to support cases where users can’t rename their files for whatever reason.

2. We could implement the `"mimes"` proposal from [nodejs/modules#160][nodejs/modules#160], which lets users control how Node treats various file extensions within a package scope. This would let users create a configuration to tell Node to treat certain extensions as ESM and others as CommonJS, for example the `--experimental-modules` pattern of `.mjs` as ESM and `.js` as CommonJS.

3. Presumably loaders would be able to enable this functionality, deciding to treat a file as CommonJS either based on file extension or some detection inside the file source.

4. We could create some other form of configuration to enable this, like a section in `package.json` that explicitly lists files to be loaded as CommonJS.

Again, we think that user demand for this use case is so low as to not warrant supporting it any more conveniently for now, especially since there are several other potential solutions that remain possible in the future within the design space of this proposal.

</details>

<details><summary>CommonJS files importing ESM</summary>

CommonJS import of ESM packages or files is outside the scope of this proposal. We presume it will be enabled via `import()`, where any specifier inside `import()` is treated like an ESM `import` statement specifier. We assume that CommonJS `require` of ESM will never be natively supported.

</details>

<details><summary>Constancy expectations when loading files</summary>

Files are read as part of the module loading process: source code files and the `package.json` files used to locate those source files or determine those source files’ parse goals. Once a file is loaded for a particular resolved URL, or a `package.json` is read as part of resolving that URL, those files are not read again. If the source file or `package.json` changes on disk, or the virtual representation of the file on disk changes, Node is unaware of the change and will continue to use the cached versions of the files as they existed when Node first read them.

</details>

## Example

See a version of Node’s Hello World tutorial written according to this proposal: [tutorial.md](./tutorial.md).

## Prior Art

- [Package exports proposal][jkrems/proposal-pkg-exports]
- [`"mimes"` field proposal][nodejs/modules#160]
- [Import Maps Proposal][domenic/import-maps]
- [Node.js ESM Resolver Specification][nodejs/ecmascript-modules/pull/12]
- [HTML spec for resolving module specifiers][whatwg-js-module-integration]

[esm-npm-modules-research-code]: ./esm-npm-modules-research 'The code to scrub packages (local)'

[jkrems/proposal-pkg-exports]: https://github.com/jkrems/proposal-pkg-exports '[Krems et al] Package Exports Proposal (repo)'

[nodejs/modules#160]: https://github.com/nodejs/modules/pull/160 "[Booth] \"mimes\" Field Proposal #160 (pr)"

[nodejs/modules#149]: https://github.com/nodejs/modules/issues/149 '[Booth] Web compatibility and ESM in .js files #149 (discussion)'

[nodejs/modules#150]: https://github.com/nodejs/modules/pull/150 '[Booth] ESM in .js files proposals #150 (pr)'

[domenic/import-maps]: https://github.com/domenic/import-maps '[Denicola] Import Maps Proposal (repo)'

[import-urls]: https://github.com/domenic/import-maps#import-urls '[Denicola] Import Maps Proposal section on `import:` URLs'

[nodejs-docs-modules-create-require-from-path]: https://nodejs.org/docs/latest/api/modules.html#modules_module_createrequirefrompath_filename '[Node.js] Documentation - Modules - createRequireFromPath (doc)'

[nodejs/ecmascript-modules:esm.md]: https://github.com/nodejs/ecmascript-modules/blob/esm-resolver-spec/doc/api/esm.md '[Node.js] Documentation - ECMAScript Modules (doc)'

[nodejs/ecmascript-modules:esm.md#resolver-algorithm]: https://github.com/nodejs/ecmascript-modules/blob/esm-resolver-spec/doc/api/esm.md#resolver-algorithm '[Node.js] Documentation - ECMAScript Modules - Resolver Algorithm (doc)'

[nodejs/ecmascript-modules/pull/12]: https://github.com/nodejs/ecmascript-modules/pull/12 '[Bedford] ESM Resolver Specification #12 (pr)'

[whatwg-js-module-integration]: https://html.spec.whatwg.org/multipage/webappapis.html#integration-with-the-javascript-module-system '[WHATWG] HTML - 8.1.3.8. Integration with the JavaScript module system'

[npm-packages-module-field-analysis]: https://gist.github.com/GeoffreyBooth/1b0d7a06bae52d124ace313634cb2f4a '[Booth] Analysis of public NPM packages using the“module”field (gist)'

[nodejs/node/pull/18392]: https://github.com/nodejs/node/pull/18392 '[Bedford] ESM: Implement esm mode flag #18392 (pr)'
