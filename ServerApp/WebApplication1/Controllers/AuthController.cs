using Microsoft.AspNetCore.Mvc;
using Fido2NetLib;
using Fido2NetLib.Objects;
using System.Text;

using JsonSerializer = System.Text.Json.JsonSerializer;

using WebAuthnServerApp.Models;
using WebAuthnServerApp.DB;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using WebAuthnServerApp.Utils;
using Microsoft.IdentityModel.Tokens;

using WebAuthnServerApp.Models.DbEntities;


namespace WebAuthnServerApp.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IFido2 fido2;
        private readonly JwtUtil _jwtUtil;
        private readonly IConfiguration _configuration;

        public AuthController(IFido2 fido2, JwtUtil jwtUtil, IConfiguration configuration)
        {   //  DI FIDO2
            this.fido2 = fido2;
            _jwtUtil = jwtUtil;
            _configuration = configuration;
        }

        // Generate challenge for client, gets User data
        [HttpPost("register/challenge")]
        public async Task<JsonResult> RegisterChallenge([FromBody] UserModel user)
        {
            // User params
            var fido2User = new Fido2User
            {
                DisplayName = user.DisplayName,
                Name = user.Username,
                Id = Encoding.UTF8.GetBytes(user.Username)
            };

            //  Get new credentials
            var options = fido2.RequestNewCredential(fido2User, new List<PublicKeyCredentialDescriptor>(),
                AuthenticatorSelection.Default, AttestationConveyancePreference.None);

            // Convert options to JSON string
            string optionsJson = JsonSerializer.Serialize(options);

            //  Save user data to JWT
            string jwt = _jwtUtil.GenerateJwtToken(user.Username, user.DisplayName, optionsJson);

            // Returns challenge for WebAuthn API on client
            return new JsonResult(new { options, jwt });
        }



        //  Generate chellange for SignIn process
        [HttpPost("signin/chellange")]
        public async Task<JsonResult> SignInChellange([FromBody] string username)
        {
            // Get user from DB
            using (BioDBContext dBContext = new())
            {
                var dbUser = await dBContext._users.FirstOrDefaultAsync(u => u.Username == username);
                
                if (dbUser == null)
                    return new JsonResult(new { success = false, error = "User not found" });

                // Create Fido2User from user data
                var fido2User = new Fido2User
                {
                    DisplayName = dbUser.DisplayName,
                    Name = dbUser.Username,
                    Id = Encoding.UTF8.GetBytes(dbUser.Username)
                };

                // Get all credentials for this user
                var credentials = await dBContext._credentials
                    .Where(c => c.UserId == dbUser.Id)
                    .Select(c => new PublicKeyCredentialDescriptor(c.CredentialId))
                    .ToListAsync();

                // Generate challenge for WebAuthn
                var options = fido2.GetAssertionOptions(credentials, UserVerificationRequirement.Required);

                // Convert options in JSON
                string optionsJson = JsonSerializer.Serialize(options);

                // Generate JWT
                string jwt = _jwtUtil.GenerateJwtToken(dbUser.Username, dbUser.DisplayName, optionsJson);

                
                return new JsonResult(new { options, jwt, challenge = options.Challenge });
            }
        }





        //  Verifuing users challenge response
        [HttpPost("signin/verify")]
        public async Task<JsonResult> SignInVerify([FromBody] AuthenticatorAssertionRawResponse response)
        {
            var authHeader = HttpContext.Request.Headers.Authorization.ToString();
            string token = authHeader.StartsWith("Bearer ") ? authHeader.Substring("Bearer ".Length).Trim() : null;

            if (string.IsNullOrEmpty(token))
                return new JsonResult(new { success = false, error = "Backend: JWT missing" });

            // check JWT
            AuthJwtModel? jwtModel = null;
            try { jwtModel = _jwtUtil.GetModelFromJwt(token); }
            catch (Exception ex) { return new JsonResult(new { success = false, error = $"Backend: Invalid JWT -> {ex.Message}" }); }

            if (string.IsNullOrEmpty(jwtModel.optionsJson))
                return new JsonResult(new { success = false, error = "Backend: Missing assertion options in JWT" });

            // deserialize saved options
            AssertionOptions cachedOptions = JsonSerializer.Deserialize<AssertionOptions>(jwtModel.optionsJson);

            using (BioDBContext dBContext = new())
            {
                // find user
                var dbUser = await dBContext._users.FirstOrDefaultAsync(u => u.Username == jwtModel.username);
                if (dbUser == null)
                    return new JsonResult(new { success = false, error = "User not found" });

                // get all user`s credentials
                var credentials = await dBContext._credentials
                    .Where(c => c.UserId == dbUser.Id)
                    .ToListAsync();

                if (!credentials.Any())
                    return new JsonResult(new { success = false, error = "No credentials found for user" });


                AssertionVerificationResult result;


                // Go throw all credentials for this user
                foreach (var credential in credentials)
                {
                    byte[] storedPublicKey = credential.PublicKey;
                    uint storedSignatureCounter = credential.SignatureCounter;

                    try
                    {
                        // 1. Get clientDataJSON from JSON
                        var clientDataJSON = response.Response.ClientDataJson;

                        // 2. Deserialize clientDataJSON
                        var clientData = JsonSerializer.Deserialize<Dictionary<string, object>>(clientDataJSON);

                        // 3. Get chellange from clientData
                        if (!clientData.TryGetValue("challenge", out var challengeObj))
                            return new JsonResult(new { success = false, error = "Challenge not found in clientData" });

                        var receivedChallenge = challengeObj.ToString();

                        // 4. Convert chellange
                        var originalChallenge = Base64UrlEncoder.Encode(cachedOptions.Challenge); // cachedOptions.Challenge - byte[]

                        if (receivedChallenge != originalChallenge)
                            return new JsonResult(new { success = false, error = "Challenge not equal to original challenge" });

                        // Library check
                        result = await fido2.MakeAssertionAsync(
                            response,
                            cachedOptions,
                            storedPublicKey,
                            storedSignatureCounter,
                            async (args, cancellationToken) => { return await Task.FromResult(true); }
                        );
                    }
                    catch (Exception ex) { return new JsonResult(new { success = false, error = ex.Message }); }

                    if (result.Status == "ok")
                    {
                        // Update counter in DB
                        credential.SignatureCounter = result.Counter;
                        await dBContext.SaveChangesAsync();

                        var jwt = _jwtUtil.AuthorizedJwt(jwtModel.username, jwtModel.displayName);

                        return new JsonResult(new { success = true, jwt });
                    }
                }

                return new JsonResult(new { success = false, error = "No valid credentials in DB" });
            }
        }




        [HttpPost("signin/face")]
        public async Task<JsonResult> SignInByFace([FromBody] FaceSignInModel faceRequest)
        {
            try
            {
                List<double> face = JsonSerializer.Deserialize<Dictionary<string, double>>(faceRequest.faceDescriptor).Values.ToList();
                List<double> faceSmiling = JsonSerializer.Deserialize<Dictionary<string, double>>(faceRequest.smileDescriptor).Values.ToList();
                List<double> faceGloomy = JsonSerializer.Deserialize<Dictionary<string, double>>(faceRequest.gloomyDescriptor).Values.ToList();


                using (BioDBContext context = new())
                {
                    UserModel? dbUser = await context._users.FirstOrDefaultAsync(x => x.Username == faceRequest.username);
                    if (dbUser == null) throw new ArgumentException("No such user");

                    List<double> dbFace = JsonSerializer.Deserialize<List<double>>(dbUser.FaceDescriptor);
                    List<double> dbFaceSmile = JsonSerializer.Deserialize<List<double>>(dbUser.SmileDescriptor);
                    List<double> dbFaceGloomy = JsonSerializer.Deserialize<List<double>>(dbUser.GloomyDescriptor);

                    //  Evclid`s distance

                    double faceMatch = FaceUtil.computeFaceDifference(face, dbFace);
                    double faceSmileMatch = FaceUtil.computeFaceDifference(faceSmiling, dbFaceSmile);
                    double faceGloomyMatch = FaceUtil.computeFaceDifference(faceGloomy, dbFaceGloomy);

                    if(faceMatch >= 0.3 || faceSmileMatch >= 0.3 || faceGloomyMatch >= 0.3) 
                        throw new Exception($"Face mismatch, ({(faceMatch + faceSmileMatch + faceGloomyMatch) / 3.0})");



                    string jwt = _jwtUtil.AuthorizedJwt(dbUser.Username, dbUser.DisplayName);
                    return new JsonResult(new { success = true, jwt });
                }
            }
            catch (Exception ex) { return new JsonResult(new { success = false, error = $"Error in FaceSignIn: {ex.Message}" }); }
        }


        // Verifying user after challenge
        [HttpPost("register/verify")]
        public async Task<JsonResult> RegisterVerify([FromBody] RegisterVerifyModel verifyReqBody)
        {

            var authHeader = HttpContext.Request.Headers.Authorization.ToString();
            string token = authHeader.StartsWith("Bearer ") ? authHeader.Substring("Bearer ".Length).Trim() : null;

            if (string.IsNullOrEmpty(token))
                return new JsonResult(new { success = false, error = "Backend: JWT missing" });


            // Check JWT
            AuthJwtModel? jwtModel = null;
            try { jwtModel = _jwtUtil.GetModelFromJwt(token); }
            catch (Exception ex) { return new JsonResult(new { success = false, error = $"Backend: Invalid JWT -> {ex.Message}" }); }


            // Deserialize challenge options to CredentialCreateOptions obj
            CredentialCreateOptions? cachedOptions = JsonSerializer.Deserialize<CredentialCreateOptions>(jwtModel.optionsJson);
            Fido2.CredentialMakeResult success;

            Debug.WriteLine(verifyReqBody.faceDescriptor);
            List<double> face = JsonSerializer.Deserialize<Dictionary<string, double>>(verifyReqBody.faceDescriptor).Values.ToList();
            List<double> faceSmiling = JsonSerializer.Deserialize<Dictionary<string, double>>(verifyReqBody.smileDescriptor).Values.ToList();
            List<double> faceGloomy = JsonSerializer.Deserialize<Dictionary<string, double>>(verifyReqBody.gloomyDescriptor).Values.ToList();


            try
            {
                // Generate credentials
                success = await fido2.MakeNewCredentialAsync(
                    verifyReqBody.attestationResponse,
                    cachedOptions,
                    async (IsCredentialIdUniqueToUserParams args, CancellationToken cancellationToken) =>
                    {
                        bool isUnique = false;

                        using (BioDBContext dBContext = new())
                        {
                            var dbCredential = await dBContext._credentials.FirstOrDefaultAsync(x => x.CredentialId == args.CredentialId);
                            if (dbCredential == null) isUnique = true;
                        }

                        return await Task.FromResult(isUnique);
                    }
                );
            }
            catch (Exception ex) { return new JsonResult(new { success = false, error = $"Backend: NewCredentil error -> {ex.Message}" }); }


            if (success.Status != "ok")
                return new JsonResult(new { success = false, error = success.ErrorMessage });

            // Save user and credential to DB
            try
            {
                using (BioDBContext dBContext = new())
                {
                    //  Check usernames in DB
                    UserModel? dbUser = await dBContext._users.FirstOrDefaultAsync(x =>
                        x.Username == jwtModel.username ||
                        x.DisplayName == jwtModel.displayName);

                    if (dbUser != null)
                        return new JsonResult(new { success = false, error = "User with such Username or DisplayName already exist." });

                    //  Create User obj
                    UserModel newUser = new UserModel
                    {
                        Username = jwtModel.username,
                        DisplayName = jwtModel.displayName,
                        FaceDescriptor = JsonSerializer.Serialize(face).ToString(),
                        SmileDescriptor = JsonSerializer.Serialize(faceSmiling).ToString(),
                        GloomyDescriptor = JsonSerializer.Serialize(faceGloomy).ToString()
                    };


                    //  Add and save user in DB
                    await dBContext._users.AddAsync(newUser);
                    await dBContext.SaveChangesAsync();

                    // Create CredentialModel obj
                    var newCredential = new CredentialModel
                    {
                        CredentialId = success.Result.CredentialId,
                        PublicKey = success.Result.PublicKey,
                        CreatedAt = DateTime.UtcNow,
                        UserId = newUser.Id,
                        SignatureCounter = 0
                    };

                    //  Add and save Credential in DB
                    await dBContext._credentials.AddAsync(newCredential);
                    await dBContext.SaveChangesAsync();
                }

                return new JsonResult(new { success = true, credentialId = success.Result.CredentialId });
            }
            catch (Exception ex) { return new JsonResult(new { success = false, error = ex.Message }); }
        }    
    }
}
