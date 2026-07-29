# =====================================================
# RUN IMAGES MIGRATION SCRIPT
# PowerShell script to add images_json column to database
# =====================================================

Write-Host "🔄 Running images migration for OrganisationLocation table..." -ForegroundColor Yellow

# Database connection parameters (update these with your actual values)
$connectionString = "Host=localhost;Port=5432;Database=appointza;Username=postgres;Password=your_password_here"

try {
    # Read the migration SQL file
    $migrationSql = Get-Content -Path "add_images_to_organisationlocation.sql" -Raw
    
    # Execute the migration
    psql -d $connectionString -c $migrationSql
    
    Write-Host "✅ Images migration completed successfully!" -ForegroundColor Green
    Write-Host "📋 Added columns:" -ForegroundColor Cyan
    Write-Host "   - images_json (JSONB, default: [])" -ForegroundColor White
    Write-Host "   - attributes_json (JSONB, default: {})" -ForegroundColor White
}
catch {
    Write-Host "❌ Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Please check your database connection and run the SQL manually:" -ForegroundColor Yellow
    Write-Host "   psql -d your_database -f add_images_to_organisationlocation.sql" -ForegroundColor White
}

Write-Host "`n🔧 Manual execution command:" -ForegroundColor Yellow
Write-Host "psql -d your_database -f add_images_to_organisationlocation.sql" -ForegroundColor White
