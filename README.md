# appointza

Appointza UI + .NET API monorepo.

## Local dev

```powershell
.\run-all.ps1
```

| App | URL |
|-----|-----|
| API (.NET) | http://localhost:5000 |
| Appointza UI | http://localhost:8083 |

## Production build

```powershell
.\build-appointza.ps1
.\appointzabuild\appointzaproduction\run.cmd
```

| What | Path |
|------|------|
| Build script | `build-appointza.ps1` |
| Config | `appointza-ui-canvas/public/config.js` |
| Output | `appointzabuild/appointzaproduction/` |

Same `public/config.js` is used for dev (`npm run dev`) and production.
