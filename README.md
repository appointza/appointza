# appointza

Appointza platform monorepo — Appointza, Campusza, AppointzaStay, and Webzys UIs with shared .NET API.

## Apps

| Path | App |
|------|-----|
| `/appointza` | Appointza UI |
| `/campusza` | Campusza UI |
| `/appointzastay` | AppointzaStay UI |
| `/webzys` | Webzys UI |

## Full build

```powershell
.\buildallacw.ps1
```

Output: `appointzabuild\production\`

## Local run

```powershell
.\appointzabuild\production\appointza.exe
```

Then open `http://localhost:5000/appointza/` (and sibling app paths).
