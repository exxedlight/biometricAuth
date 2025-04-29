using Fido2NetLib;

namespace WebAuthnServerApp.Models
{
    public class RegisterVerifyModel
    {
        public AuthenticatorAttestationRawResponse attestationResponse { get; set; }
        public string faceDescriptor { get; set; }
        public string smileDescriptor { get; set; }
        public string gloomyDescriptor { get; set; }
    }
}
