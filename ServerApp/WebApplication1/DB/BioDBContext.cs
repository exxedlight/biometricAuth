using Microsoft.EntityFrameworkCore;
using WebAuthnServerApp.Models.DbEntities;

namespace WebAuthnServerApp.DB
{
    public class BioDBContext : DbContext
    {
        public static string con_str = @"Data Source=(LocalDB)\MSSQLLocalDB;AttachDbFilename=D:\zDocs\C_Sharp\ASP.NET\Biomethric-WebAuthn\ServerApp\WebApplication1\DB\BioAuthnDB.mdf;Integrated Security=True;Connect Timeout=30";

        public DbSet<UserModel> _users { get; set; }                //  users table
        public DbSet<CredentialModel> _credentials { get; set; }    //  credentials table
        public DbSet<QrTunnelModel> _qrs {  get; set; }             //  QR-codes table

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlServer(con_str);
        }
    }
}
