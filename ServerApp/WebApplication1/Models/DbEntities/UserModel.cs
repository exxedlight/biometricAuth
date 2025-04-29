using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace WebAuthnServerApp.Models.DbEntities
{
    public class UserModel
    {
        
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        
        public string? Username { get; set; }
        public string? DisplayName { get; set; }

        public string? FaceDescriptor { get; set; }
        public string? SmileDescriptor { get; set; }
        public string? GloomyDescriptor { get; set; }
    }
}
