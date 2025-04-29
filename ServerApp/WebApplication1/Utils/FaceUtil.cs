namespace WebAuthnServerApp.Utils
{
    public static class FaceUtil
    {
        public static double computeFaceDifference(List<double> testFace, List<double> faceFromDb)
        {
            double match = 0;
            int len = Math.Max(testFace.Count, faceFromDb.Count);
            for (int i = 0; i < len; i++)
            {
                match += Math.Pow(testFace[i] - faceFromDb[i], 2);
            }
            match = Math.Sqrt(match);
            
            return match;
        }
    }
}
