using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebAuthnServerApp.Migrations
{
    /// <inheritdoc />
    public partial class AddedFaceDescriptorToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FaceDescriptor",
                table: "_users",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FaceDescriptor",
                table: "_users");
        }
    }
}
