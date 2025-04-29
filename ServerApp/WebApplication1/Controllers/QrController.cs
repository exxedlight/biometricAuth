using Fido2NetLib.Objects;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAuthnServerApp.DB;
using WebAuthnServerApp.Models;
using WebAuthnServerApp.Models.DbEntities;
using WebAuthnServerApp.Utils;

namespace WebAuthnServerApp.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class QrController : Controller
    {
        private readonly JwtUtil _jwtUtil;
        public QrController(JwtUtil jwtUtil)
        {
            _jwtUtil = jwtUtil;
        }

        [HttpGet("getqr")]
        public async Task<JsonResult> GetNewQrCode()
        {
            try
            {
                using (BioDBContext context = new())
                {
                    await DbUtil.CleanExpiredQrs();


                    Guid oneTimeCode;
                    while (true)
                    {
                        oneTimeCode = Guid.NewGuid();
                        if (!context._qrs.Any(x => x.OneTimeCode == oneTimeCode.ToString())) break;
                    }

                    QrTunnelModel qr = new QrTunnelModel
                    {
                        CreatedAt = DateTime.Now,
                        ExpiresAt = DateTime.Now.AddMinutes(1),
                        OneTimeCode = oneTimeCode.ToString(),
                        IsActive = true,
                        CallbackUrl = "/Qr/verify"
                    };

                    await context._qrs.AddAsync(qr);
                    await context.SaveChangesAsync();

                    return new JsonResult(new { success = true, qr });
                }
            }
            catch (Exception ex) { return new JsonResult(new { success = false, error = $"QR get error: {ex.Message}" }); }
        }

        [HttpPost("verify")]
        public async Task<JsonResult> VerifyDevice([FromBody] VerifyQrRequest qrData)
        {
            try
            {
                using (BioDBContext context = new())
                {
                    QrTunnelModel? requestQr = await context._qrs.FirstOrDefaultAsync(x => x.OneTimeCode == qrData.oneTimeCode);

                    if (requestQr == null)
                        return new JsonResult(new { success = false, error = "No such QR-code in DB." });

                    if (requestQr.ExpiresAt < DateTime.Now)
                    {
                        context._qrs.Remove(requestQr);
                        await context.SaveChangesAsync();
                        return new JsonResult(new { success = false, error = "QR-code already expired, regenerate it." });
                    }

                    context._qrs.Remove(requestQr);
                    await context.SaveChangesAsync();


                    UserModel user = await context._users.FirstAsync(x => x.Username == qrData.username);
                    string jwt = _jwtUtil.AuthorizedJwt(user.Username, user.DisplayName);

                    return new JsonResult(new { success = true, jwt });
                }
            }
            catch (Exception ex) { return new JsonResult(new { success = false, error = $"Qr verify error: {ex.Message}" }); }
        }

    }
}
