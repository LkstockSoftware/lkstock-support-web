using System.Text.Json.Serialization;

namespace LkStockSupportWeb.Models;

public sealed class LoginResponse
{
    [JsonPropertyName("accessToken")]
    public string? AccessToken { get; set; }
}

public sealed class SessionInfo
{
    [JsonPropertyName("email")]
    public string Email { get; set; } = "";
}

public sealed class ConversationResponse
{
    [JsonPropertyName("conversations")]
    public List<Conversation> Conversations { get; set; } = [];
}

public sealed class MessageResponse
{
    [JsonPropertyName("messages")]
    public List<SupportMessage> Messages { get; set; } = [];
}

public sealed class Conversation
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("wa_id")]
    public string WaId { get; set; } = "";

    [JsonPropertyName("display_name")]
    public string? DisplayName { get; set; }

    [JsonPropertyName("company_id")]
    public string? CompanyId { get; set; }

    [JsonPropertyName("company_name")]
    public string? CompanyName { get; set; }

    [JsonPropertyName("pinned")]
    public bool Pinned { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "bot";
}

public sealed class SupportMessage
{
    [JsonPropertyName("direction")]
    public string Direction { get; set; } = "inbound";

    [JsonPropertyName("body")]
    public string? Body { get; set; }

    [JsonPropertyName("delivery_status")]
    public string? DeliveryStatus { get; set; }

    [JsonPropertyName("created_at")]
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed record ProfileUpdateRequest(string DisplayName, string CompanyId, string CompanyName);
