using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebAuthnServerApp.Migrations
{
    /// <inheritdoc />
    public partial class AddSignatureCounterToCredentials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "SignatureCounter",
                table: "_credentials",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SignatureCounter",
                table: "_credentials");
        }
    }
}
