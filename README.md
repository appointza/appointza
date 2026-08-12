# appointza

Appointza platform monorepo — Appointza, Campusza, AppointzaStay, and Webzys UIs with shared .NET API.

## Local dev (separate ports, hot reload)

```powershell
.\run-all.ps1
```

| App | URL |
|-----|-----|
| API (.NET) | http://localhost:5000 |
| Webzys | http://localhost:8081 |
| Appointza | http://localhost:8083 |
| Campusza | http://localhost:8087 |
| Stay | http://localhost:8088 |
| Admin (Metro) | http://localhost:8091 |

## Production build — separate folder per product (server + wwwroot)

Each product folder lives under **`appointzabuild/`**:

| Product | Build | Output folder | Port |
|---------|-------|---------------|------|
| All | `.\build-separate.ps1` | — | — |
| Appointza | `.\build-appointza.ps1` | `appointzabuild/appointzaproduction/` | 5000 |
| Stay | `.\build-stay.ps1` | `appointzabuild/stayproduction/` | 5001 |
| Campusza | `.\build-campusza.ps1` | `appointzabuild/campuszaproduction/` | 5002 |
| Webzys | `.\build-webzys.ps1` | `appointzabuild/webzysproduction/` | 5003 |

```
appointzabuild/
  appointzaproduction/
    appointza.exe
    config.js
    wwwroot/index.html
    run.cmd
  stayproduction/
    appointza.exe
    wwwroot/index.html
    ...
```

```powershell
.\build-separate.ps1
.\run-all-production.ps1
.\appointzabuild\stayproduction\run.cmd
```

Live URLs: `.\build-separate.ps1 -HostName appointza.com`

## Combined production build (single host, path prefixes)

For deploy behind one nginx → `:5000` with `/appointza`, `/campusza`, `/stay`, `/webzys`:

```powershell
.\buildallacw.ps1
```

Output: `appointzabuild\production\`

```powershell
.\appointzabuild\production\appointza.exe
```

Then: http://localhost:5000/appointza/ , `/campusza/` , `/stay/` , `/webzys/`
