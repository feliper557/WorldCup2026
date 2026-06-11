using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChampionPredictionPoints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsCorrect",
                table: "ChampionPredictions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "PointsAwarded",
                table: "ChampionPredictions",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsCorrect",
                table: "ChampionPredictions");

            migrationBuilder.DropColumn(
                name: "PointsAwarded",
                table: "ChampionPredictions");
        }
    }
}
