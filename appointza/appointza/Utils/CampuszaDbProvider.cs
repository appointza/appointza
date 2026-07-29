using Microsoft.Extensions.Options;

namespace appointza.Utils
{
    public class CampuszaDbProvider : ICampuszaDbProvider
    {
        private readonly IDbProvider dbProvider;
        private readonly ApplicationEnvironment applicationEnvironment;

        public CampuszaDbProvider(IDbProvider dbProvider, IOptions<ApplicationEnvironment> applicationEnvironment)
        {
            this.dbProvider = dbProvider;
            this.applicationEnvironment = applicationEnvironment.Value;
        }

        public Task<IDb> GetDb()
        {
            var connectionString = applicationEnvironment.campusza_postgresqlconnection;
            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new DbException(DbException.Codes.ConnectionStringNotFound);
            }

            return dbProvider.GetDb(connectionString);
        }
    }
}
