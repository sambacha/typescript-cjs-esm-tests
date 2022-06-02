#!/usr/env/bin bash
## @note If you need to include a lot of packages in the transpiler list you can generate the list like this:
## @see https://github.com/vercel/next.js/issues/25454#issuecomment-905707191
cd node_modules
echo "Generating list for transpilation..."
for d in $(ls); do grep '"type": "module"' "$d"/package.json >/dev/null 2>&1 && echo \"$d\", ; done
