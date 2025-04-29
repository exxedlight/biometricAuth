using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using WebAuthnServerApp.Models;

namespace WebAuthnServerApp.Utils
{
    public class JwtUtil
    {
        private readonly IConfiguration _configuration;
        SymmetricSecurityKey key;
        SigningCredentials creds;

        public JwtUtil(IConfiguration configuration)
        {
            _configuration = configuration;
            key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        }

        public string GenerateJwtToken(string username, string displayName, string optionsJson)
        {
            var claims = new[]
            {
                new Claim("username", username),
                new Claim("displayName", displayName),
                new Claim("options", optionsJson),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(30),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string AuthorizedJwt(string username, string displayName)
        {
            var claims = new[] {
                new Claim("username", username),
                new Claim("displayName", displayName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(30),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public AuthJwtModel GetModelFromJwt(string token)
        {
            var handler = new JwtSecurityTokenHandler();
            AuthJwtModel model = new();

            var claimsPrincipal = handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"])),
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidAudience = _configuration["Jwt:Audience"]
            }, out SecurityToken validatedToken);

            // Get info from claims
            model.username = claimsPrincipal.FindFirst("username")?.Value;
            model.displayName = claimsPrincipal.FindFirst("displayName")?.Value;
            model.optionsJson = claimsPrincipal.FindFirst("options")?.Value;

            return model;
        }
    }
}
