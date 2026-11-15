# Plugin SDK and registry contract

Start from [`templates/plugin`](../../templates/plugin). A manifest declares a stable ID, semantic plugin and API versions, relative entrypoint, SHA-256 integrity, source, and scoped permissions.

`validatePluginManifest()` checks strict IDs and versions, runtime API compatibility, trusted source membership, safe relative paths, entrypoint presence/integrity, unique scoped permissions and permission expansion. A new permission is rejected unless explicitly listed in `approvedAdditionalPermissions`. Manifest checks do not execute plugin code. Validate the bytes you will load, then load only after trust, integrity and permissions pass.

`validatePluginContract()` checks unique tool IDs and requires side-effecting tools to declare `workspace:write`. `runPluginContractCases()` executes deterministic inputs against handlers and validates their outputs; call it in the plugin's own test suite before packaging. It returns per-case PASS/FAIL records and rejects an invalid plugin contract before running a handler.

```ts
const errors = validatePluginManifest(manifest, files, {
  runtimeApiVersion: "1.3.0",
  trustedSources: ["https://registry.eureka42.ai"],
  previouslyGrantedPermissions: ["workspace:read"],
  approvedAdditionalPermissions: [],
});
if (errors.length) throw new Error(errors.join("; "));
```

The current registry contract is local validation only. It does not claim that a package is signed or published, and the example registry URL is not a live service guarantee.
