using Amazon.Util.Internal.PlatformServices;
using appointza.AwsS3;
using appointza.Models;
using appointza.Utils;
using Microsoft.Extensions.Options;
using System.Data.Common;
using System.Net.Mime;

namespace appointza.Services
{
    public class FilesService
    {
        IDbProvider dbprovider;
        IQueryBuilderProvider querybuilderprovider;
        RequestState requeststate;
        ApplicationEnvironment applicationenvironment;
        AwsS3Service awss3service;
        public FilesService(IDbProvider dbprovider, IQueryBuilderProvider querybuilderprovider, RequestState requeststate, IOptions<ApplicationEnvironment> applicationenvironment, AwsS3Service awss3service)
        {
            this.dbprovider = dbprovider;
            this.querybuilderprovider = querybuilderprovider;
            this.requeststate = requeststate;
            this.applicationenvironment = applicationenvironment.Value;
            this.awss3service = awss3service;
        }
        public async Task<List<Files>> Select(FilesSelectReq req)
        {
            List<Files> result = null;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.SelectTransaction(db, req);
            }
            return result;
        }
        public async Task<List<Files>> SelectTransaction(IDb db, FilesSelectReq req)
        {
            List<Files> result = new List<Files>();
            string query = @"
                SELECT Files.id,Files.type,Files.content,Files.version,Files.createdby,Files.createdon,Files.modifiedby,Files.modifiedon,Files.attributes,Files.isactive,Files.issuspended,Files.parentid,Files.isfactory,Files.notes
                FROM Files
                ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            if (req.id > 0)
            {
                queryBuilder.AddParameter("Files.id", "=", "id", req.id, DbTypes.Types.Long);
            }
            queryBuilder.AddParameter("Files.isactive", "=", "isactive", true, DbTypes.Types.Boolean);

            queryBuilder.AddOrderBy(QueryBuilder.Order.ASC, "Files.id");
            var command = queryBuilder.GetCommand(db);
            using (DbDataReader reader = await db.Execute(command))
            {
                while (await reader.ReadAsync())
                {
                    Files temp = new Files();
                    temp.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                    temp.type = reader["type"] == DBNull.Value ? "" : reader["type"].ToString();
                    temp.content = reader["content"] == DBNull.Value ? null : (byte[])reader["content"];
                    temp.version = reader["version"] == DBNull.Value ? 0 : Convert.ToInt32(reader["version"]);
                    temp.createdby = reader["createdby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["createdby"]);
                    temp.createdon = reader["createdon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["createdon"]);
                    temp.modifiedby = reader["modifiedby"] == DBNull.Value ? 0 : Convert.ToInt64(reader["modifiedby"]);
                    temp.modifiedon = reader["modifiedon"] == DBNull.Value ? Base.GetMinimumDate() : Convert.ToDateTime(reader["modifiedon"]);
                    temp.attributes_json = reader["attributes"] == DBNull.Value ? "null" : reader["attributes"].ToString();
                    temp.isactive = reader["isactive"] == DBNull.Value ? false : Convert.ToBoolean(reader["isactive"]);
                    temp.issuspended = reader["issuspended"] == DBNull.Value ? false : Convert.ToBoolean(reader["issuspended"]);
                    temp.parentid = reader["parentid"] == DBNull.Value ? 0 : Convert.ToInt64(reader["parentid"]);
                    temp.isfactory = reader["isfactory"] == DBNull.Value ? false : Convert.ToBoolean(reader["isfactory"]);
                    temp.notes = reader["notes"] == DBNull.Value ? "" : reader["notes"].ToString();
                    result.Add(temp);
                }
            }
            return result;
        }
        public async Task<Files> Insert(Files files)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.InsertTransaction(db, files);
            }
            return files;
        }
        public async Task InsertTransaction(IDb db, Files files)
        {
            String query = @"
                INSERT INTO Files (
                    type,content,version,createdby,createdon,modifiedby,modifiedon,attributes,isactive,issuspended,parentid,isfactory,notes
                )
                VALUES (
                   @type,@content,@version,@createdby,@createdon,@modifiedby,@modifiedon,@attributes,@isactive,@issuspended,@parentid,@isfactory,@notes
                )
                RETURNING id;
                ";
            files.isactive = true;
            files.version = 1;
            files.createdon = DateTime.UtcNow;
            files.createdby = requeststate.usercontext.userid;
            files.modifiedon = DateTime.UtcNow;
            files.modifiedby = requeststate.usercontext.userid;

            DbCommand command = db.GetCommand(query);

            db.AddParameter(command, "type", DbTypes.Types.String).Value = files.type;
            db.AddParameter(command, "content", DbTypes.Types.ByteArray).Value = files.content;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = files.version;
            db.AddParameter(command, "createdby", DbTypes.Types.Long).Value = files.createdby;
            db.AddParameter(command, "createdon", DbTypes.Types.DateTime).Value = files.createdon;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = files.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = files.modifiedon;
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = files.attributes_json;
            db.AddParameter(command, "isactive", DbTypes.Types.Boolean).Value = files.isactive;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = files.issuspended;
            db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = files.parentid;
            db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = files.isfactory;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(files.notes) ? "" : files.notes;

            using (DbDataReader reader = await db.Execute(command))
            {
                if (await reader.ReadAsync())
                {
                    files.id = reader["id"] == DBNull.Value ? 0 : Convert.ToInt64(reader["id"]);
                }
            }
        }
        public async Task<Files> Update(Files files)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                await this.UpdateTransaction(db, files);
            }
            return files;
        }
        public async Task<bool> UpdateTransaction(IDb db, Files files)
        {
            bool result = false;
            String query = @"
                UPDATE Files
                    SET 
                        type = @type,content = @content,modifiedby = @modifiedby,modifiedon = @modifiedon,attributes = @attributes,issuspended = @issuspended,parentid = @parentid,isfactory = @isfactory,notes = @notes,
                        version = version + 1
                ";

            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);

            queryBuilder.AddParameter("id", "=", "id", files.id, DbTypes.Types.Long);

            if (files.version > 0)
            {
                queryBuilder.AddParameter("version", "=", "version", files.version, DbTypes.Types.Integer);
            }

            var command = queryBuilder.GetCommand(db);

            files.modifiedon = DateTime.UtcNow;
            files.modifiedby = requeststate.usercontext.userid;

            db.AddParameter(command, "id", DbTypes.Types.Long).Value = files.id;
            db.AddParameter(command, "type", DbTypes.Types.String).Value = files.type;
            db.AddParameter(command, "content", DbTypes.Types.ByteArray).Value = files.content;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = files.version;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = files.modifiedby;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = files.modifiedon;
            db.AddParameter(command, "attributes", DbTypes.Types.Json).Value = files.attributes_json;
            db.AddParameter(command, "issuspended", DbTypes.Types.Boolean).Value = files.issuspended;
            db.AddParameter(command, "parentid", DbTypes.Types.Long).Value = files.parentid;
            db.AddParameter(command, "isfactory", DbTypes.Types.Boolean).Value = files.isfactory;
            db.AddParameter(command, "notes", DbTypes.Types.String).Value = String.IsNullOrEmpty(files.notes) ? "" : files.notes;

            if (await db.ExecuteNonQuery(command) > 0)
            {
                files.version = files.version + 1;
                result = true;
            }
            return result;
        }
        public async Task<bool> Delete(FilesDeleteReq files)
        {
            bool result = false;
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                result = await this.DeleteTransaction(db, files);

            }
            return result;
        }
        public async Task<bool> DeleteTransaction(IDb db, FilesDeleteReq files)
        {
            bool result = false;
            String query = @"
                UPDATE Files
                SET isactive = '0',
                    version = version + 1,
                    modifiedon = @modifiedon,
                    modifiedby = @modifiedby 
                ";
            var queryBuilder = querybuilderprovider.GetQueryBuilder(query);
            queryBuilder.AddParameter("id", "=", "id", files.id, DbTypes.Types.Long);
            if (files.version > 0)
            {
                queryBuilder.AddParameter("version", "=", "version", files.version, DbTypes.Types.Integer);
            }
            DbCommand command = queryBuilder.GetCommand(db);
            db.AddParameter(command, "id", DbTypes.Types.Long).Value = files.id;
            db.AddParameter(command, "version", DbTypes.Types.Integer).Value = files.version;
            db.AddParameter(command, "modifiedby", DbTypes.Types.Long).Value = requeststate.usercontext.userid;
            db.AddParameter(command, "modifiedon", DbTypes.Types.DateTime).Value = DateTime.UtcNow;
            if (await db.ExecuteNonQuery(command) > 0)
            {
                result = true;
            }
            return result;
        }
        public async Task<List<long>> Upload(List<IFormFile> files)
        {
            using (IDb db = await dbprovider.GetDb())
            {
                await db.Connect();
                return await UploadTransaction(db, files);
            }
        }
        public async Task<List<long>> UploadTransaction(IDb db, List<IFormFile> files)
        {
            List<long> result = new List<long>();

            foreach (var item in files)
            {
                if (item.Length == 0)
                {
                    continue;
                }

                var content = new byte[item.Length];
                Stream fileStream = item.OpenReadStream();
                fileStream.Read(content);

                Files file = new Files();
                file.type = item.FileName.Split('.').Last();
                if (!applicationenvironment.awss3config.iss3enabled)
                {
                    file.content = content;
                }
                else
                {
                    file.content = new byte[] { };
                }
                await InsertTransaction(db, file);

                if (applicationenvironment.awss3config.iss3enabled)
                {
                    await awss3service.WriteObj(file.id.ToString(), content);
                }

                result.Add(file.id);
            }

            return result;
        }
        public async Task<Files> Get(long id)
        {
            Files file;
            try
            {
                var fileList = await this.Select(new FilesSelectReq() { id = id });
                if (fileList.Count == 0)
                {
                    throw new AppException(AppException.ErrorCodes.FileNotFound);
                }
                file = fileList[0];


                if (file.content.Length == 0 && applicationenvironment.awss3config.iss3enabled)
                {
                    file.content = await awss3service.GetObj(file.id.ToString());
                }
            }
            catch (Exception)
            {

                throw;
            }

            return file;
        }
    }
}
