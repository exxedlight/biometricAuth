**Authentication Module with FIDO2 (WebAuthn) and Face Recognition**
This is a prototype **authentication module** that combines _FIDO2 (WebAuthn)_ with face recognition (_face-api.js_). It supports passwordless sign-up and sign-in using either a FIDO2-compatible device (e.g., Android phone) or facial descriptors based on multiple emotional states.

**🔐 Sign-Up Flow**
During sign-up, the module captures three facial expressions (normal, smiling, gloomy) as face descriptors. The system verifies emotion detection before saving the descriptors.
![image](https://github.com/user-attachments/assets/f8613c9f-44b7-4eef-a230-a99ed5094d39)
Using Android device as key:
![image](https://github.com/user-attachments/assets/df243708-cb5e-40db-933f-13962cad751b)
SignUp log example:
![image](https://github.com/user-attachments/assets/f06d5ab6-262c-4f76-8ee6-f3b5694dfa01)
SignUp success:
![image](https://github.com/user-attachments/assets/4737d1c9-cf0e-4cb5-863d-b4b127d7d788)

**🔓 Sign-In Flow**
**Note**: _QR-authentication is not implemented._
The user must present the same three facial expressions as during sign-up. The system compares the new descriptors with the stored ones.
![image](https://github.com/user-attachments/assets/a35cc302-a10f-49f6-9b17-e9d1ca6d79d1)
QR-auth not implemented (!)
Face SignIn requires same three states as descriptors for checking match:
![image](https://github.com/user-attachments/assets/e1575cee-f393-49da-83a4-1be54c8d339d)

Face SignIn success:
![image](https://github.com/user-attachments/assets/518d976e-05a3-468d-99ff-802216587df2)

No required emotion detected:
![2025-04-29 19-53-09](https://github.com/user-attachments/assets/9addf6a6-23c0-4b58-8b52-15326d374da5)

Face SignIn fail (face missmatch):
![image](https://github.com/user-attachments/assets/ee93b955-870b-47c9-86bc-e920a6227769)
