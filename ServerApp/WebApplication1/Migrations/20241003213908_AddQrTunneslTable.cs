using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebAuthnServerApp.Migrations
{
    /// <inheritdoc />
    public partial class AddQrTunneslTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "_qrs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    OneTimeCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CallbackUrl = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK__qrs", x => x.Id);
                    table.ForeignKey(
                        name: "FK__qrs__users_UserId",
                        column: x => x.UserId,
                        principalTable: "_users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX__qrs_UserId",
                table: "_qrs",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "_qrs");
        }
    }
}
