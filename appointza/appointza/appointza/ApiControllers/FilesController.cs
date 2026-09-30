using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FilesController : ControllerBase
    {
        ILogger<FilesController> logger;
        FilesService filesService;
        public FilesController(ILogger<FilesController> logger, FilesService filesService)
        {
            this.logger = logger;
            this.filesService = filesService;
        }
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<Files>>> Entity()
        {
            ActionRes<Files> result = new ActionRes<Files>()
            {
               item = new Files()
            };

            return Ok(result);
        }
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<Files>>>> Select(ActionReq<FilesSelectReq> req)
        {
            ActionRes<List<Files>> result = new ActionRes<List<Files>>();

            result.item = await filesService.Select(req.item);

            return Ok(result);
        }
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<Files>>> Insert(ActionReq<Files> req)
        {
            ActionRes<Files> result = new ActionRes<Files>();

            result.item = await filesService.Insert(req.item);

            return Ok(result);
        }
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<Files>>> Update(ActionReq<Files> req)
        {
            ActionRes<Files> result = new ActionRes<Files>();

            result.item = await filesService.Update(req.item);

            return Ok(result);
        }
        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<Files>>> Save(ActionReq<Files> req)
        {
            ActionRes<Files> result = new ActionRes<Files>();

            if(req.item.id > 0){
                result.item = await filesService.Update(req.item);
            }else{
                result.item = await filesService.Insert(req.item);
            }

            return Ok(result);
        }
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<FilesDeleteReq> req)
        {
            ActionRes<bool> result = new ActionRes<bool>();

            result.item = await filesService.Delete(req.item);

            return Ok(result);
        }
        [HttpPost("Upload")]
        public async Task<ActionResult<ActionRes<List<long>>>> Upload(List<IFormFile> files)
        {
            ActionRes<List<long>> response = new ActionRes<List<long>>();
            response.item = await filesService.Upload(files);
            return Ok(response);
        }
        [HttpGet("Get")]
        public async Task<IActionResult> Get(int id)
        {
            Files file = await filesService.Get(id);
            var etag = $"\"file-{file.id}-v{file.version}\"";
            var ifNoneMatch = Request.Headers.IfNoneMatch.ToString();
            if (!string.IsNullOrWhiteSpace(ifNoneMatch)
                && ifNoneMatch.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Any(value => string.Equals(value, etag, StringComparison.Ordinal)))
            {
                Response.Headers.ETag = etag;
                Response.Headers.CacheControl = "public, max-age=86400";
                return StatusCode(StatusCodes.Status304NotModified);
            }

            Stream stream = new MemoryStream(file.content);
            var contentType = ResolveContentType(file.type);
            Response.Headers.ETag = etag;
            Response.Headers.CacheControl = "public, max-age=86400";
            return File(stream, contentType, $"{file.id}.{file.type}", enableRangeProcessing: true);
        }

        private static string ResolveContentType(string? fileType)
        {
            return (fileType ?? "").Trim().ToLowerInvariant() switch
            {
                "png" => "image/png",
                "jpg" or "jpeg" => "image/jpeg",
                "gif" => "image/gif",
                "webp" => "image/webp",
                "svg" => "image/svg+xml",
                "pdf" => "application/pdf",
                _ => "application/octet-stream",
            };
        }
    }
}
