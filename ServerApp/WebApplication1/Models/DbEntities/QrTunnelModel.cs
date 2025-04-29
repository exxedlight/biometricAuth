using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace WebAuthnServerApp.Models.DbEntities
{
    public class QrTunnelModel
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public int? UserId { get; set; }

        [ForeignKey("UserId")]
        public UserModel? User { get; set; }


        public bool IsActive { get; set; } // Статус активации
        public string? OneTimeCode { get; set; } // Одноразовый код или nonce
        public string? CallbackUrl { get; set; } // URL для завершения аутентификации
    }
}
