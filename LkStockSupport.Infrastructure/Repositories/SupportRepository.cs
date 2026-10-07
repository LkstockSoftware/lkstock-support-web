using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using LkStockSupport.Domain.Models;

namespace LkStockSupport.Infrastructure.Repositories;

public interface ISupportRepository
{
    Task<LoginResponse?> LoginAsync(string email, string password);
    Task<SessionInfo?> GetSessionAsync(string accessToken);
    Task<IReadOnlyList<Conversation>> GetConversationsAsync(string accessToken, string? search = null);
    Task<IReadOnlyList<SupportMessage>> GetMessagesAsync(string accessToken, string conversationId);
    Task<bool> TakeoverAsync(string accessToken, string conversationId);
    Task<bool> ReturnToBotAsync(string accessToken, string conversationId);
    Task<bool> CloseAsync(string accessToken, string conversationId);
    Task<bool> SetPinnedAsync(string accessToken, string conversationId, bool pinned);
    Task<bool> UpdateProfileAsync(string accessToken, string conversationId, ProfileUpdateRequest profile);
    Task<bool> SendReplyAsync(string accessToken, string conversationId, string text);
}

public sealed class SupportRepository(HttpClient http) : ISupportRepository
{
    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };
    public async Task<LoginResponse?> LoginAsync(string email, string password) { using var response = await http.PostAsJsonAsync("api/auth/login", new { email, password }); return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<LoginResponse>(Json) : null; }
    public async Task<SessionInfo?> GetSessionAsync(string accessToken) { using var response = await SendAsync(HttpMethod.Get, "api/session", accessToken); return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<SessionInfo>(Json) : null; }
    public async Task<IReadOnlyList<Conversation>> GetConversationsAsync(string accessToken, string? search = null) { var url = string.IsNullOrWhiteSpace(search) ? "api/conversations" : $"api/conversations?search={Uri.EscapeDataString(search)}"; using var response = await SendAsync(HttpMethod.Get, url, accessToken); return response.IsSuccessStatusCode ? (await response.Content.ReadFromJsonAsync<ConversationResponse>(Json))?.Conversations ?? [] : []; }
    public async Task<IReadOnlyList<SupportMessage>> GetMessagesAsync(string accessToken, string conversationId) { using var response = await SendAsync(HttpMethod.Get, $"api/messages?conversationId={Uri.EscapeDataString(conversationId)}", accessToken); return response.IsSuccessStatusCode ? (await response.Content.ReadFromJsonAsync<MessageResponse>(Json))?.Messages ?? [] : []; }
    public Task<bool> TakeoverAsync(string accessToken, string conversationId) => RunActionAsync(accessToken, "takeover", conversationId);
    public Task<bool> ReturnToBotAsync(string accessToken, string conversationId) => RunActionAsync(accessToken, "return_to_bot", conversationId);
    public Task<bool> CloseAsync(string accessToken, string conversationId) => RunActionAsync(accessToken, "close", conversationId);
    public Task<bool> SetPinnedAsync(string accessToken, string conversationId, bool pinned) => RunActionAsync(accessToken, pinned ? "pin" : "unpin", conversationId);
    public async Task<bool> UpdateProfileAsync(string accessToken, string conversationId, ProfileUpdateRequest profile) { using var response = await SendAsync(HttpMethod.Post, "api/actions", accessToken, new { action = "profile_update", conversationId, displayName = profile.DisplayName, companyId = profile.CompanyId, companyName = profile.CompanyName }); return response.IsSuccessStatusCode; }
    public async Task<bool> SendReplyAsync(string accessToken, string conversationId, string text) { using var response = await SendAsync(HttpMethod.Post, "api/reply", accessToken, new { conversationId, text }); return response.IsSuccessStatusCode; }
    private async Task<bool> RunActionAsync(string accessToken, string action, string conversationId) { using var response = await SendAsync(HttpMethod.Post, "api/actions", accessToken, new { action, conversationId }); return response.IsSuccessStatusCode; }
    private Task<HttpResponseMessage> SendAsync(HttpMethod method, string url, string accessToken, object? body = null) { var request = new HttpRequestMessage(method, url); request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken); if (body is not null) request.Content = JsonContent.Create(body); return http.SendAsync(request); }
}
