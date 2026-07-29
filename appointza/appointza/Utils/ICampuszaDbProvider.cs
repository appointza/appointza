namespace appointza.Utils
{
    /// <summary>Database access for Campusza product domain (separate PostgreSQL database).</summary>
    public interface ICampuszaDbProvider
    {
        Task<IDb> GetDb();
    }
}
