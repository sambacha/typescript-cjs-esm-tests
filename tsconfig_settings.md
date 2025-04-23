# TypeScript Configuration Options

| Category | Option | Value | Description |
|----------|--------|-------|-------------|
| **Language and Environment** | `target` | `"es2016"` | Set the JavaScript language version for emitted JavaScript and include compatible library declarations. |
| **Modules** | `module` | `"commonjs"` | Specify what module code is generated. |
| **Interop Constraints** | `esModuleInterop` | `true` | Emit additional JavaScript to ease support for importing CommonJS modules. This enables 'allowSyntheticDefaultImports' for type compatibility. |
| **Interop Constraints** | `forceConsistentCasingInFileNames` | `true` | Ensure that casing is correct in imports. |
| **Type Checking** | `strict` | `true` | Enable all strict type-checking options. |
| **Completeness** | `skipLibCheck` | `true` | Skip type checking all .d.ts files. |

## Commented Out Options

### Projects
| Option | Description |
|--------|-------------|
| `incremental` | Save .tsbuildinfo files to allow for incremental compilation of projects. |
| `composite` | Enable constraints that allow a TypeScript project to be used with project references. |
| `tsBuildInfoFile` | Specify the path to .tsbuildinfo incremental compilation file. |
| `disableSourceOfProjectReferenceRedirect` | Disable preferring source files instead of declaration files when referencing composite projects. |
| `disableSolutionSearching` | Opt a project out of multi-project reference checking when editing. |
| `disableReferencedProjectLoad` | Reduce the number of projects loaded automatically by TypeScript. |

### Language and Environment
| Option | Description |
|--------|-------------|
| `lib` | Specify a set of bundled library declaration files that describe the target runtime environment. |
| `jsx` | Specify what JSX code is generated. |
| `libReplacement` | Enable lib replacement. |
| `experimentalDecorators` | Enable experimental support for legacy experimental decorators. |
| `emitDecoratorMetadata` | Emit design-type metadata for decorated declarations in source files. |
| `jsxFactory` | Specify the JSX factory function used when targeting React JSX emit, e.g. 'React.createElement' or 'h'. |
| `jsxFragmentFactory` | Specify the JSX Fragment reference used for fragments when targeting React JSX emit e.g. 'React.Fragment' or 'Fragment'. |
| `jsxImportSource` | Specify module specifier used to import the JSX factory functions when using 'jsx: react-jsx*'. |
| `reactNamespace` | Specify the object invoked for 'createElement'. This only applies when targeting 'react' JSX emit. |
| `noLib` | Disable including any library files, including the default lib.d.ts. |
| `useDefineForClassFields` | Emit ECMAScript-standard-compliant class fields. |
| `moduleDetection` | Control what method is used to detect module-format JS files. |

### Modules
| Option | Description |
|--------|-------------|
| `rootDir` | Specify the root folder within your source files. |
| `moduleResolution` | Specify how TypeScript looks up a file from a given module specifier. |
| `baseUrl` | Specify the base directory to resolve non-relative module names. |
| `paths` | Specify a set of entries that re-map imports to additional lookup locations. |
| `rootDirs` | Allow multiple folders to be treated as one when resolving modules. |
| `typeRoots` | Specify multiple folders that act like './node_modules/@types'. |
| `types` | Specify type package names to be included without being referenced in a source file. |
| `allowUmdGlobalAccess` | Allow accessing UMD globals from modules. |
| `moduleSuffixes` | List of file name suffixes to search when resolving a module. |
| `allowImportingTsExtensions` | Allow imports to include TypeScript file extensions. Requires '--moduleResolution bundler' and either '--noEmit' or '--emitDeclarationOnly' to be set. |
| `rewriteRelativeImportExtensions` | Rewrite '.ts', '.tsx', '.mts', and '.cts' file extensions in relative import paths to their JavaScript equivalent in output files. |
| `resolvePackageJsonExports` | Use the package.json 'exports' field when resolving package imports. |
| `resolvePackageJsonImports` | Use the package.json 'imports' field when resolving imports. |
| `customConditions` | Conditions to set in addition to the resolver-specific defaults when resolving imports. |
| `noUncheckedSideEffectImports` | Check side effect imports. |
| `resolveJsonModule` | Enable importing .json files. |
| `allowArbitraryExtensions` | Enable importing files with any extension, provided a declaration file is present. |
| `noResolve` | Disallow 'import's, 'require's or '<reference>'s from expanding the number of files TypeScript should add to a project. |

### JavaScript Support
| Option | Description |
|--------|-------------|
| `allowJs` | Allow JavaScript files to be a part of your program. Use the 'checkJS' option to get errors from these files. |
| `checkJs` | Enable error reporting in type-checked JavaScript files. |
| `maxNodeModuleJsDepth` | Specify the maximum folder depth used for checking JavaScript files from 'node_modules'. Only applicable with 'allowJs'. |

### Emit
| Option | Description |
|--------|-------------|
| `declaration` | Generate .d.ts files from TypeScript and JavaScript files in your project. |
| `declarationMap` | Create sourcemaps for d.ts files. |
| `emitDeclarationOnly` | Only output d.ts files and not JavaScript files. |
| `sourceMap` | Create source map files for emitted JavaScript files. |
| `inlineSourceMap` | Include sourcemap files inside the emitted JavaScript. |
| `noEmit` | Disable emitting files from a compilation. |
| `outFile` | Specify a file that bundles all outputs into one JavaScript file. If 'declaration' is true, also designates a file that bundles all .d.ts output. |
| `outDir` | Specify an output folder for all emitted files. |
| `removeComments` | Disable emitting comments. |
| `importHelpers` | Allow importing helper functions from tslib once per project, instead of including them per-file. |
| `downlevelIteration` | Emit more compliant, but verbose and less performant JavaScript for iteration. |
| `sourceRoot` | Specify the root path for debuggers to find the reference source code. |
| `mapRoot` | Specify the location where debugger should locate map files instead of generated locations. |
| `inlineSources` | Include source code in the sourcemaps inside the emitted JavaScript. |
| `emitBOM` | Emit a UTF-8 Byte Order Mark (BOM) in the beginning of output files. |
| `newLine` | Set the newline character for emitting files. |
| `stripInternal` | Disable emitting declarations that have '@internal' in their JSDoc comments. |
| `noEmitHelpers` | Disable generating custom helper functions like '__extends' in compiled output. |
| `noEmitOnError` | Disable emitting files if any type checking errors are reported. |
| `preserveConstEnums` | Disable erasing 'const enum' declarations in generated code. |
| `declarationDir` | Specify the output directory for generated declaration files. |

### Interop Constraints
| Option | Description |
|--------|-------------|
| `isolatedModules` | Ensure that each file can be safely transpiled without relying on other imports. |
| `verbatimModuleSyntax` | Do not transform or elide any imports or exports not marked as type-only, ensuring they are written in the output file's format based on the 'module' setting. |
| `isolatedDeclarations` | Require sufficient annotation on exports so other tools can trivially generate declaration files. |
| `erasableSyntaxOnly` | Do not allow runtime constructs that are not part of ECMAScript. |
| `allowSyntheticDefaultImports` | Allow 'import x from y' when a module doesn't have a default export. |
| `preserveSymlinks` | Disable resolving symlinks to their realpath. This correlates to the same flag in node. |

### Type Checking
| Option | Description |
|--------|-------------|
| `noImplicitAny` | Enable error reporting for expressions and declarations with an implied 'any' type. |
| `strictNullChecks` | When type checking, take into account 'null' and 'undefined'. |
| `strictFunctionTypes` | When assigning functions, check to ensure parameters and the return values are subtype-compatible. |
| `strictBindCallApply` | Check that the arguments for 'bind', 'call', and 'apply' methods match the original function. |
| `strictPropertyInitialization` | Check for class properties that are declared but not set in the constructor. |
| `strictBuiltinIteratorReturn` | Built-in iterators are instantiated with a 'TReturn' type of 'undefined' instead of 'any'. |
| `noImplicitThis` | Enable error reporting when 'this' is given the type 'any'. |
| `useUnknownInCatchVariables` | Default catch clause variables as 'unknown' instead of 'any'. |
| `alwaysStrict` | Ensure 'use strict' is always emitted. |
| `noUnusedLocals` | Enable error reporting when local variables aren't read. |
| `noUnusedParameters` | Raise an error when a function parameter isn't read. |
| `exactOptionalPropertyTypes` | Interpret optional property types as written, rather than adding 'undefined'. |
| `noImplicitReturns` | Enable error reporting for codepaths that do not explicitly return in a function. |
| `noFallthroughCasesInSwitch` | Enable error reporting for fallthrough cases in switch statements. |
| `noUncheckedIndexedAccess` | Add 'undefined' to a type when accessed using an index. |
| `noImplicitOverride` | Ensure overriding members in derived classes are marked with an override modifier. |
| `noPropertyAccessFromIndexSignature` | Enforces using indexed accessors for keys declared using an indexed type. |
| `allowUnusedLabels` | Disable error reporting for unused labels. |
| `allowUnreachableCode` | Disable error reporting for unreachable code. |

### Completeness
| Option | Description |
|--------|-------------|
| `skipDefaultLibCheck` | Skip type checking .d.ts files that are included with TypeScript. |
