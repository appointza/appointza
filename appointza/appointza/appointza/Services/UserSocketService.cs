using appointza.Models;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace appointza.Services
{
    public class UserSocketService
    {
        private readonly Dictionary<string, List<WebSocket>> _userSockets = new();
        private readonly ILogger<UserSocketService> _logger;

        public UserSocketService(ILogger<UserSocketService> logger)
        {
            _logger = logger;
        }

        // Add a new WebSocket connection for a user
        public void AddConnection(string userId, WebSocket webSocket)
        {
            if (!_userSockets.ContainsKey(userId))
            {
                _userSockets[userId] = new List<WebSocket>();
            }

            _userSockets[userId].Add(webSocket);
            _logger.LogInformation($"User {userId} connected. Total connections: {_userSockets[userId].Count}");
        }

        // Remove a WebSocket connection for a user
        public void RemoveConnection(string userId, WebSocket webSocket)
        {
            if (_userSockets.ContainsKey(userId))
            {
                _userSockets[userId].Remove(webSocket);
                _logger.LogInformation($"User {userId} disconnected. Total connections: {_userSockets[userId].Count}");

                // Remove the user if no WebSockets remain
                if (_userSockets[userId].Count == 0)
                {
                    _userSockets.Remove(userId);
                    _logger.LogInformation($"User {userId} has no more connections.");
                }
            }
        }

        // Get all WebSocket connections for a user
        public List<WebSocket> GetSocketsByUserId(string userId)
        {
            _userSockets.TryGetValue(userId, out var sockets);
            return sockets;
        }

        // Send a message to a specific user (to all their sockets)
        public async Task<bool> SendMessageToUser(string userId, UserSocketMessage message)
        {
            var result = false;
            var sockets = GetSocketsByUserId(userId);
            if (sockets != null)
            {
                foreach (var socket in sockets.Where(s => s.State == WebSocketState.Open))
                {
                    var buffer = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message));
                    await socket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
                    result = true;
                }
            }
            return result;
        }

        // Broadcast a message to all users (all their sockets)
        public async Task BroadcastMessageAsync(string message)
        {
            foreach (var sockets in _userSockets.Values)
            {
                foreach (var socket in sockets.Where(s => s.State == WebSocketState.Open))
                {
                    var buffer = Encoding.UTF8.GetBytes(message);
                    await socket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
                }
            }
        }
    }
}
