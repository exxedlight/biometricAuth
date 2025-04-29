
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using WebAuthnServerApp.Utils;

namespace WebAuthnServerApp
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            var configuration = builder.Configuration;

            // Add services to the container.

            builder.Services.AddControllers();//.AddNewtonsoftJson();
            
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();
            builder.Services.AddDistributedMemoryCache();
            builder.Services.AddSession(opt =>
            {
                opt.IdleTimeout = TimeSpan.FromMinutes(30);
                opt.Cookie.HttpOnly = true;
                opt.Cookie.IsEssential = true;
                opt.Cookie.SecurePolicy = CookieSecurePolicy.None; // ��� ����������
            });
            builder.Services.AddSingleton<JwtUtil>();

            //  ������ ������ (����� + �������)
            string localhost_domen = "https://localhost:3000";
            string localhost_back = "https://localhost:5001";
            string ngrok_domen = "https://2775-194-4-68-217.ngrok-free.app";

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend",
                    builder =>
                    {
                        //  ���� NGROK ����
                        builder.WithOrigins(localhost_domen, ngrok_domen, localhost_back)
                               .AllowAnyHeader()
                               .AllowAnyMethod()
                               .AllowCredentials();
                    });
            });

            //  ��� ������ �� ������ ������_������
            //  --------------------------------------------
            builder.Services.AddFido2(options =>
            {
                options.ServerDomain = ngrok_domen.Replace("https://", "");// "7c0a-194-4-68-195.ngrok-free.app"; //"localhost";
                options.ServerName = "Passwordless ASP.NET API";
                options.Origins = new(){ localhost_domen, ngrok_domen };
                options.TimestampDriftTolerance = 300000;
            });
            //  ---------------------------------------------

            // ��������� ������������ JWT
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Jwt:Issuer"],
                    ValidAudience = configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]))
                };
            });

            builder.WebHost.ConfigureKestrel(options =>
            {
                //options.ListenAnyIP(5000); // For HTTP
                options.ListenAnyIP(5001, listenOptions =>
                {
                    listenOptions.UseHttps(Path.Combine("certificates", "localhost.pfx"), ""); // For HTTPS
                });
            });

            var app = builder.Build();

            app.UseSession();
            app.UseCors("AllowFrontend");


            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }


            app.UseHttpsRedirection();
            app.UseAuthentication();
            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
