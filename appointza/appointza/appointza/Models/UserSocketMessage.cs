namespace appointza.Models
{
    public class UserSocketMessage
    {
        public UserSocketMessageActions action { get; set; }
        public Object payload { get; set; }
    }
    public enum UserSocketMessageActions
    {
        None = 0,
        MessageSend = 1,
        MessageNew = 2,
        MessageDelivered = 3,
        MessageStatusUpdate = 4,
        MessageRead = 5
    }
}
