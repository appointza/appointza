using appointza.Models;
using appointza.Services;
using Microsoft.AspNetCore.Mvc;

namespace appointza.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewController : ControllerBase
    {
        ILogger<ReviewController> logger;
        ReviewService reviewService;
        
        public ReviewController(ILogger<ReviewController> logger, ReviewService reviewService)
        {
            this.logger = logger;
            this.reviewService = reviewService;
        }
        
        [HttpGet("Entity")]
        public async Task<ActionResult<ActionRes<Review>>> Entity()
        {
            ActionRes<Review> result = new ActionRes<Review>()
            {
                item = new Review()
            };

            return Ok(result);
        }
        
        [HttpPost("Select")]
        public async Task<ActionResult<ActionRes<List<Review>>>> Select(ActionReq<ReviewSelectReq> req)
        {
            try
            {
                ActionRes<List<Review>> result = new ActionRes<List<Review>>();

                result.item = await reviewService.Select(req.item);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Error in Review Select endpoint: {Message}\n{StackTrace}", ex.Message, ex.StackTrace);
                return StatusCode(500, new ActionRes<List<Review>> 
                { 
                    item = new List<Review>(),
                    error = $"Error: {ex.Message}"
                });
            }
        }
        
        [HttpPost("Insert")]
        public async Task<ActionResult<ActionRes<Review>>> Insert(ActionReq<Review> req)
        {
            try
            {
                ActionRes<Review> result = new ActionRes<Review>();

                result.item = await reviewService.Insert(req.item);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Error in Review Insert endpoint: {Message}", ex.Message);
                return StatusCode(500, new ActionRes<Review> 
                { 
                    item = null,
                    error = $"Error: {ex.Message}"
                });
            }
        }
        
        [HttpPost("Update")]
        public async Task<ActionResult<ActionRes<Review>>> Update(ActionReq<Review> req)
        {
            try
            {
                ActionRes<Review> result = new ActionRes<Review>();

                result.item = await reviewService.Update(req.item);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Error in Review Update endpoint: {Message}", ex.Message);
                return StatusCode(500, new ActionRes<Review> 
                { 
                    item = null,
                    error = $"Error: {ex.Message}"
                });
            }
        }
        
        [HttpPost("Save")]
        public async Task<ActionResult<ActionRes<Review>>> Save(ActionReq<Review> req)
        {
            try
            {
                ActionRes<Review> result = new ActionRes<Review>();

                if(req.item.id > 0)
                {
                    result.item = await reviewService.Update(req.item);
                }
                else
                {
                    result.item = await reviewService.Insert(req.item);
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Error in Review Save endpoint: {Message}", ex.Message);
                return StatusCode(500, new ActionRes<Review> 
                { 
                    item = null,
                    error = $"Error: {ex.Message}"
                });
            }
        }
        
        [HttpPost("Delete")]
        public async Task<ActionResult<ActionRes<bool>>> Delete(ActionReq<ReviewDeleteReq> req)
        {
            try
            {
                ActionRes<bool> result = new ActionRes<bool>();

                result.item = await reviewService.Delete(req.item);

                return Ok(result);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Error in Review Delete endpoint: {Message}", ex.Message);
                return StatusCode(500, new ActionRes<bool> 
                { 
                    item = false,
                    error = $"Error: {ex.Message}"
                });
            }
        }
    }
}

