using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebAuthnServerApp.Migrations
{
    /// <inheritdoc />
    public partial class EditedQrTunneslTable_NoRequireUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK__qrs__users_UserId",
                table: "_qrs");

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "_qrs",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK__qrs__users_UserId",
                table: "_qrs",
                column: "UserId",
                principalTable: "_users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK__qrs__users_UserId",
                table: "_qrs");

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "_qrs",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK__qrs__users_UserId",
                table: "_qrs",
                column: "UserId",
                principalTable: "_users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
