using Microsoft.EntityFrameworkCore;
using WebAuthnServerApp.DB;
using WebAuthnServerApp.Models.DbEntities;

namespace WebAuthnServerApp.Utils
{
    public static class DbUtil
    {
        public static async Task CleanExpiredQrs()
        {
            using (BioDBContext context = new())
            {
                List<QrTunnelModel> expiredQrs = await context._qrs.Where(x => x.ExpiresAt < DateTime.Now).ToListAsync();
                context._qrs.RemoveRange(expiredQrs);
                await context.SaveChangesAsync();
            }
        }
    }
}
