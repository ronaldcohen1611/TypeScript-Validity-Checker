# TypeScript-Validity-Checker
A small command line tool to run tsc on a project without needing to create a full-build

Currently only supports pnpm, to be updated in the future for all package managers

# Run 
- To use, simply run the script using `node validateTypes.js`

# Usage and Error handling
- By defualt TS-Validity-Checker will check your system for the path of whre pnpm is installed
- If its not found you can opt to pass it the path via `node validateType.js **path_to_pnpm**`
