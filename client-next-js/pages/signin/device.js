import { useState } from 'react';
import { useRouter } from 'next/router';
import { base64UrlToBuffer, bufferToBase64Url } from '../../utils/dataconverter.js';
import { frontend_domain } from '../../net-pathes.mjs';
import '../css/styles.css';

const SignInDevice = () => {
    const [username, setUsername] = useState('');
    const [log, setLog] = useState('');
    const router = useRouter();
    const [isRButtonHovered, setRButtonHovered] = useState(false);
    const [isLogAHovered, setLogAHovered] = useState(false);
    const [isLogVisible, setLogVisible] = useState(false);


    const handleSignIn = async () => {
        setLog("SignIn button pressed.\n");

        if (username.length < 1) {
            setLog("Please enter your username.\n");
            return;
        }

        try {
            const response = await fetch('/api/auth/login/challenge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(username),
                credentials: 'include',
            });

            if (!response.ok) throw new Error(`Get challenge error: ${response.statusText}`);
            else setLog((prev) => prev + 'Response gotten.\n');

            const response_data = await response.json();
            if (response_data.success == false) {
                setLog((prev) => prev + 'Error: ' + response_data.error);
                return;
            }

            const jwt = response_data.jwt;
            if (jwt) {
                localStorage.setItem('jwt', jwt);
                setLog((prev) => prev + "JWT saved.\n");
            }
            else {
                throw new Error("No JWT!");
            }

            //setLog((prev) => prev + JSON.stringify(response_data, null, 2) + '\n\n');

            const options = response_data.options;

            setLog((prev) => prev + "\noptions response: \n" + JSON.stringify(options));

            options.challenge = base64UrlToBuffer(options.challenge);
            options.allowCredentials = options.allowCredentials.map(cred => ({
                ...cred,
                id: base64UrlToBuffer(cred.id)
            }));
            options.rp = {
                name: "localhost",
                id: frontend_domain
            }

            setLog((prev) => prev + "\noptions modded: \n" + JSON.stringify(options));

            const credential = await navigator.credentials.get({ publicKey: options });

            const assertionResponse = {
                id: bufferToBase64Url(credential.rawId),
                rawId: bufferToBase64Url(credential.rawId),
                response: {
                    authenticatorData: bufferToBase64Url(credential.response.authenticatorData),
                    clientDataJSON: bufferToBase64Url(credential.response.clientDataJSON),
                    signature: bufferToBase64Url(credential.response.signature),
                    userHandle: credential.response.userHandle ? bufferToBase64Url(credential.response.userHandle) : null
                },
                type: credential.type,
            };

            const verifyResponse = await fetch('/api/auth/login/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
                },
                body: JSON.stringify(assertionResponse),
                credentials: 'include',
            });

            if (!verifyResponse.ok) throw new Error(`Verify error: ${verifyResponse.statusText}`);

            const verifyResult = await verifyResponse.json();
            setLog(`Verifying result: ${JSON.stringify(verifyResult)}\n`);



            if (verifyResult.success == true) {

                //  SAVE JWT
                const token = verifyResult.jwt;
                localStorage.setItem("authorizedUser", token);

                router.push('/user/account');
            }

        } catch (error) {
            setLog((prev) => prev + `\nError: ${error.message}\n`);
        }
    };

    return (
        <div className='main-container'>
            <div className='wrapper'>

                <h1>Sign In</h1>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className='inputs'
                />
                <button
                    onClick={handleSignIn}
                    className='action-button'
                >
                    Sign In
                </button>
                <a
                    onClick={() => router.push('/register')} // Переход на страницу регистрации
                    onMouseEnter={() => setRButtonHovered(true)}
                    onMouseLeave={() => setRButtonHovered(false)}
                    className='go-register-button'
                >
                    Go to Register
                </a>
                <a
                    onClick={() => setLogVisible(!isLogVisible)}
                    onMouseEnter={() => setLogAHovered(true)}
                    onMouseLeave={() => setLogAHovered(false)}
                    className='switch-log'
                >
                    Switch log
                </a>
                <textarea
                    value={log}
                    readOnly
                    rows={10}
                    style={{
                        display: isLogVisible ? 'flex' : 'none',
                        fontSize: '14px',
                        margin: '10px',
                        padding: '10px',
                        width: '300px',
                        resize: 'none'
                    }}
                />


                <br />
                <div className='down-buttons-container'>
                    <a className='button-a' onClick={() => router.push('/signin/qr')}>Using QR-code</a>
                    <a className='button-a' onClick={() => router.push('/signin/face')}>Using face</a>
                </div>
            </div>


        </div>
    );
};

export default SignInDevice;
