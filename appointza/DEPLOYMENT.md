# appointza Production Deployment Guide

## Production Build

### Quick Build Commands

**Windows (PowerShell):**
```powershell
.\build-production.ps1
```

**Linux/macOS (Bash):**
```bash
chmod +x build-production.sh
./build-production.sh
```

**Manual Build:**
```bash
dotnet restore appointza/appointza.csproj
dotnet build appointza/appointza.csproj -c Release
dotnet publish appointza/appointza.csproj -c Release -o ./publish --self-contained false
```

## Build Output

The production build is published to: `./publish/`

## Prerequisites on Target Server

1. **.NET 6.0 Runtime** (or SDK)
   - Download from: https://dotnet.microsoft.com/download/dotnet/6.0
   - Verify installation: `dotnet --version`

2. **PostgreSQL Database**
   - Ensure database is accessible from the server
   - Update connection string in `appsettings.json`

3. **Required Services:**
   - Redis (if using Redis caching)
   - AWS S3 (if using S3 for file storage)

## Deployment Steps

### 1. Copy Files to Server
Copy all files from the `publish` folder to your production server.

### 2. Update Configuration
Edit `appsettings.json` with production settings:
- Database connection string
- AWS credentials (if using S3)
- JWT secret
- Razorpay keys (production keys)
- Firebase configuration
- Redis connection string

### 3. Set Environment Variables (Optional)
You can override settings using environment variables:
```bash
export ASPNETCORE_ENVIRONMENT=Production
export ConnectionStrings__DefaultConnection="your-connection-string"
```

### 4. Run the Application

**Option A: Direct Execution**
```bash
cd /path/to/publish
./appointza
```

**Option B: Using dotnet**
```bash
cd /path/to/publish
dotnet appointza.dll
```

**Option C: As a Service (Linux systemd)**
Create `/etc/systemd/system/appointza.service`:
```ini
[Unit]
Description=appointza Production App
After=network.target

[Service]
Type=notify
WorkingDirectory=/path/to/publish
ExecStart=/usr/bin/dotnet /path/to/publish/appointza.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=appointza
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable appointza
sudo systemctl start appointza
sudo systemctl status appointza
```

**Option D: IIS (Windows)**
1. Install .NET 6.0 Hosting Bundle
2. Create application pool targeting .NET CLR Version "No Managed Code"
3. Point website to publish folder
4. Configure bindings and SSL

### 5. Configure Reverse Proxy (Recommended)

**Nginx Example:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Important Files to Review

Before deployment, ensure these files are properly configured:

1. **appsettings.json** - Production configuration
2. **appsettings.Development.json** - Should not be used in production
3. **log4net.config** - Logging configuration
4. **appointza-a0d00-firebase-adminsdk-fbsvc-6b82ca7db4.json** - Firebase credentials

## Security Checklist

- [ ] Change default JWT secret
- [ ] Use production database connection string
- [ ] Use production Razorpay keys (not test keys)
- [ ] Secure Firebase admin SDK JSON file
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set proper file permissions
- [ ] Remove or secure development settings
- [ ] Update package versions with known vulnerabilities:
  - Npgsql (currently 6.0.7 has vulnerabilities)
  - System.Data.SqlClient (has vulnerabilities)
  - System.IdentityModel.Tokens.Jwt (has moderate vulnerability)

## Monitoring

- Check application logs in the configured log directory
- Monitor database connections
- Monitor Redis connections (if used)
- Set up health checks endpoint monitoring

## Troubleshooting

### Connection Issues
- Verify database connection string
- Check firewall rules
- Verify network connectivity

### Performance Issues
- Check connection pooling settings
- Monitor database query performance
- Review Redis cache usage

### Build Warnings
The build shows some package vulnerability warnings. Consider updating:
- `Npgsql` to latest version
- `System.Data.SqlClient` to `Microsoft.Data.SqlClient`
- `System.IdentityModel.Tokens.Jwt` to latest version

## Rollback Procedure

1. Stop the application
2. Restore previous version from backup
3. Restart the application
4. Verify functionality

