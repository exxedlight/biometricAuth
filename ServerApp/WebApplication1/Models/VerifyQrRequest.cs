namespace WebAuthnServerApp.Models
{
    public class VerifyQrRequest
    {
        public string username {  get; set; }
        public string oneTimeCode { get; set; }
    }
}
