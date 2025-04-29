using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace WebAuthnServerApp.Models.DbEntities
{
    public class CredentialModel
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public byte[] CredentialId { get; set; }
        public byte[] PublicKey { get; set; }
        public DateTime CreatedAt { get; set; }
        public uint SignatureCounter { get; set; }
        public int UserId { get; set; }
        public UserModel User { get; set; }

    }
}
