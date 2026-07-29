using Npgsql;

namespace appointza.Data.AppointzaStay;

public static class PostgresBootstrap
{
    public static async Task<PostgresBootstrapResult> EnsureSchemaAsync(
        string? connectionString,
        string contentRootPath,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return new PostgresBootstrapResult(false, false, "No PostgreSQL connection string configured.");
        }

        try
        {
            await using var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync(cancellationToken);

            var schemaPath = Path.Combine(contentRootPath, "Database", "schema.sql");
            if (!File.Exists(schemaPath))
                return new PostgresBootstrapResult(true, false, $"Connected, but schema file not found: {schemaPath}");

            var schemaAlreadyApplied = await TableExistsAsync(connection, "organisations", cancellationToken);
            if (!schemaAlreadyApplied)
            {
                var sql = await File.ReadAllTextAsync(schemaPath, cancellationToken);
                await ExecuteScriptAsync(connection, sql, cancellationToken);
                logger.LogInformation("PostgreSQL schema applied from Database/schema.sql");
            }
            else
            {
                logger.LogInformation("PostgreSQL connected — schema already present");
                await ApplyWalletMigrationsAsync(connection, cancellationToken);
                await ApplyOrganisationMigrationsAsync(connection, cancellationToken);
            }

            return new PostgresBootstrapResult(true, true, "PostgreSQL ready");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "PostgreSQL bootstrap failed");
            return new PostgresBootstrapResult(false, false, ex.Message);
        }
    }

    private static async Task ApplyWalletMigrationsAsync(
        NpgsqlConnection connection,
        CancellationToken cancellationToken)
    {
        var migrations = new[]
        {
            "ALTER TABLE organisation_billing ADD COLUMN IF NOT EXISTS billing_mode VARCHAR(20) NOT NULL DEFAULT 'subscription'",
            "ALTER TABLE organisation_billing ADD COLUMN IF NOT EXISTS wallet_credit_balance INT NOT NULL DEFAULT 0",
            "ALTER TABLE organisation_billing ADD COLUMN IF NOT EXISTS wallet_free_used_month INT NOT NULL DEFAULT 0",
            "ALTER TABLE organisation_billing ADD COLUMN IF NOT EXISTS wallet_free_month_key VARCHAR(7) NOT NULL DEFAULT ''",
            "ALTER TABLE organisation_billing ADD COLUMN IF NOT EXISTS credits_per_booking INT NOT NULL DEFAULT 1",
        };

        foreach (var sql in migrations)
        {
            await using var cmd = new NpgsqlCommand(sql, connection);
            await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
    }

    private static async Task ApplyOrganisationMigrationsAsync(
        NpgsqlConnection connection,
        CancellationToken cancellationToken)
    {
        var migrations = new[]
        {
            "ALTER TABLE organisations ADD COLUMN IF NOT EXISTS guest_services JSONB NOT NULL DEFAULT '[]'::jsonb",
            "ALTER TABLE organisations ADD COLUMN IF NOT EXISTS payment_gateway JSONB NOT NULL DEFAULT '{}'::jsonb",
            "ALTER TABLE organisations ADD COLUMN IF NOT EXISTS property_type VARCHAR(30) NOT NULL DEFAULT 'hotel'",
            "ALTER TABLE organisations ADD COLUMN IF NOT EXISTS booking_type VARCHAR(20) NOT NULL DEFAULT 'overnight'",
            "ALTER TABLE organisations ADD COLUMN IF NOT EXISTS minimum_hours INT NOT NULL DEFAULT 2",
            "ALTER TABLE organisations ADD COLUMN IF NOT EXISTS overnight_time_mode VARCHAR(20) NOT NULL DEFAULT 'fixed'",
            "ALTER TABLE organisations ADD COLUMN IF NOT EXISTS referral_code VARCHAR(32) NOT NULL DEFAULT ''",
            "ALTER TABLE organisations ADD COLUMN IF NOT EXISTS referred_by_organisation_id VARCHAR(64)",
            "ALTER TABLE booking_details ADD COLUMN IF NOT EXISTS guest_services JSONB NOT NULL DEFAULT '[]'::jsonb",
            "ALTER TABLE booking_details ADD COLUMN IF NOT EXISTS packages JSONB NOT NULL DEFAULT '[]'::jsonb",
            "ALTER TABLE booking_details ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(120) NOT NULL DEFAULT ''",
            "ALTER TABLE booking_details ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(120) NOT NULL DEFAULT ''",
            "ALTER TABLE booking_details ADD COLUMN IF NOT EXISTS booking_type VARCHAR(20) NOT NULL DEFAULT 'overnight'",
            "ALTER TABLE booking_details ADD COLUMN IF NOT EXISTS duration INT NOT NULL DEFAULT 0",
            "ALTER TABLE booking_details ADD COLUMN IF NOT EXISTS hours INT NOT NULL DEFAULT 0",
            "ALTER TABLE booking_details ALTER COLUMN room_id DROP NOT NULL",
            "ALTER TABLE booking_details ADD COLUMN IF NOT EXISTS check_in_time VARCHAR(8) NOT NULL DEFAULT '14:00'",
            "ALTER TABLE booking_details ADD COLUMN IF NOT EXISTS check_out_time VARCHAR(8) NOT NULL DEFAULT '11:00'",
            "ALTER TABLE organisations ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false",
            "ALTER TABLE organisations ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ",
            "ALTER TABLE organisations ADD COLUMN IF NOT EXISTS verified_by_user_id VARCHAR(64)",
            "ALTER TABLE organisations ADD COLUMN IF NOT EXISTS pincode VARCHAR(20) NOT NULL DEFAULT ''",
            "ALTER TABLE organisations ADD COLUMN IF NOT EXISTS slots JSONB NOT NULL DEFAULT '[]'::jsonb",
            "ALTER TABLE organisations ADD COLUMN IF NOT EXISTS closures JSONB NOT NULL DEFAULT '[]'::jsonb",
        };

        foreach (var sql in migrations)
        {
            await using var cmd = new NpgsqlCommand(sql, connection);
            await cmd.ExecuteNonQueryAsync(cancellationToken);
        }
    }

    private static async Task<bool> TableExistsAsync(
        NpgsqlConnection connection,
        string tableName,
        CancellationToken cancellationToken)
    {
        await using var cmd = new NpgsqlCommand(
            """
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = @table
            )
            """,
            connection);
        cmd.Parameters.AddWithValue("table", tableName);
        var result = await cmd.ExecuteScalarAsync(cancellationToken);
        return result is true;
    }

    private static async Task ExecuteScriptAsync(
        NpgsqlConnection connection,
        string sql,
        CancellationToken cancellationToken)
    {
        await using var batch = new NpgsqlBatch(connection);
        foreach (var statement in SplitStatements(sql))
            batch.BatchCommands.Add(new NpgsqlBatchCommand(statement));

        if (batch.BatchCommands.Count > 0)
            await batch.ExecuteNonQueryAsync(cancellationToken);
    }

    private static IEnumerable<string> SplitStatements(string sql)
    {
        var cleaned = new List<string>();
        foreach (var line in sql.Split('\n'))
        {
            var trimmed = line.Trim();
            if (trimmed.Length == 0 || trimmed.StartsWith("--", StringComparison.Ordinal))
                continue;
            cleaned.Add(line);
        }

        var text = string.Join('\n', cleaned);
        foreach (var part in text.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (part.Length > 0)
                yield return part;
        }
    }
}

public record PostgresBootstrapResult(bool Connected, bool SchemaReady, string Message);
