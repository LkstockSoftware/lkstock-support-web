using Xunit;
using System.Net;
using System.Net.Http.Headers;
using System.Text;
using LkStockSupport.Domain.Models;
using LkStockSupport.Infrastructure.Repositories;

namespace LkStockSupportWeb.Tests;

public sealed class SupportRepositoryTests
{
    [Fact]
    public async Task GetConversationsAsync_uses_bearer_token_search_and_deserializes_models()
    {
        HttpRequestMessage? captured = null;
        using var client = new HttpClient(new StubHandler(request =>
        {
            captured = request;
            return Json("""{"conversations":[{"id":"c1","wa_id":"595992327777","display_name":"Cliente","status":"bot"}]}""");
        })) { BaseAddress = new Uri("https://soporte.lkstock.xyz/") };
        var repository = new SupportRepository(client);

        var conversations = await repository.GetConversationsAsync("token-123", "Cliente Uno");

        var item = Assert.Single(conversations);
        Assert.Equal("c1", item.Id);
        Assert.Equal("Cliente", item.DisplayName);
        Assert.Equal("Bearer", captured!.Headers.Authorization!.Scheme);
        Assert.Equal("token-123", captured.Headers.Authorization.Parameter);
        Assert.Equal("/api/conversations?search=Cliente%20Uno", captured.RequestUri!.PathAndQuery);
    }

    [Fact]
    public async Task SendReplyAsync_posts_typed_request_with_authorization()
    {
        HttpRequestMessage? captured = null;
        using var client = new HttpClient(new StubHandler(request =>
        {
            captured = request;
            return new HttpResponseMessage(HttpStatusCode.OK);
        })) { BaseAddress = new Uri("https://soporte.lkstock.xyz/") };
        var repository = new SupportRepository(client);

        var sent = await repository.SendReplyAsync("token-123", "conversation-1", "Hola cliente");

        Assert.True(sent);
        Assert.Equal(HttpMethod.Post, captured!.Method);
        Assert.Equal("/api/reply", captured.RequestUri!.AbsolutePath);
        Assert.Equal("Bearer", captured.Headers.Authorization!.Scheme);
        var payload = await captured.Content!.ReadAsStringAsync();
        Assert.Contains("conversation-1", payload);
        Assert.Contains("Hola cliente", payload);
    }

    private static HttpResponseMessage Json(string body) => new(HttpStatusCode.OK)
    {
        Content = new StringContent(body, Encoding.UTF8, "application/json")
    };

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> handler) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) => Task.FromResult(handler(request));
    }
}
