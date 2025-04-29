namespace WebAuthnServerApp.Models
{
    public class FaceSignInModel
    {
        public string username {  get; set; }
        public string faceDescriptor { get; set; }
        public string smileDescriptor { get; set; }
        public string gloomyDescriptor { get; set; }
    }
}
