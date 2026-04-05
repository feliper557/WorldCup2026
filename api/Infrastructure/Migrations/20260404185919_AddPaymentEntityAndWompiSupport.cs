using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentEntityAndWompiSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    UserEmail = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WompiTransactionId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    WompiReference = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    AmountInCents = table.Column<long>(type: "bigint", nullable: false),
                    AmountCOP = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                    PaymentMethodType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    WompiStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Environment = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    WompiEventTimestamp = table.Column<long>(type: "bigint", nullable: false),
                    WebhookReceivedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CardBrand = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CardLastFour = table.Column<string>(type: "nvarchar(4)", maxLength: 4, nullable: true),
                    IsRefunded = table.Column<bool>(type: "bit", nullable: false),
                    RefundedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_Status_CreatedAtUtc",
                table: "Payments",
                columns: new[] { "Status", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_Payments_UserId",
                table: "Payments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_WompiReference",
                table: "Payments",
                column: "WompiReference");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_WompiTransactionId",
                table: "Payments",
                column: "WompiTransactionId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Payments");
        }
    }
}
