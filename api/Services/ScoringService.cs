using WorldCup.Api.Models;

namespace WorldCup.Api.Services;

public interface IScoringService
{
    int CalculatePoints(Match match, Prediction prediction);
}

public class ScoringService : IScoringService
{
    public int CalculatePoints(Match match, Prediction prediction)
    {
        if (!match.HomeScoreFinal.HasValue || !match.AwayScoreFinal.HasValue)
            return 0; // Match not finished yet

        var fh = match.HomeScoreFinal.Value;
        var fa = match.AwayScoreFinal.Value;
        var ph = prediction.HomeScorePred;
        var pa = prediction.AwayScorePred;

        // Exact score: 3 points
        if (fh == ph && fa == pa)
            return 3;

        // Correct sign (winner/draw): 1 point
        int finalSign = Math.Sign(fh - fa);
        int predSign = Math.Sign(ph - pa);

        if (finalSign == predSign)
            return 1;

        // Wrong prediction: 0 points
        return 0;
    }
}
