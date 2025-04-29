import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { base64UrlToBuffer, bufferToBase64Url } from '../utils/dataconverter.js'
import { frontend_domain } from '../net-pathes.mjs';

import * as faceapi from 'face-api.js';
import { loadModels } from '../loadModels.js';

import './css/styles.css';

//_________________________________________________________________________________________________________________________________________________________
//       ______________    ________________  _______________                                                         ________________  ______________                                      
//      |##############\  |###############| |#|#############____     |####|##|###| |########      |###############| |###############| |##############\                                                                        
//      |#|          /#/  |###############| |#|#################     |####|##|###| |############| |###############| |###############| |#|          /#/                                                               
//      |#|         /#/   |#|               |#|             ####          |##|      ####    ####|       |###|       |#|               |#|         /#/   
//      |#|        /#/    |#|               |#|                           |##|      ####                |###|       |#|               |#|        /#/           
//      |###########/     |###############| |#|      _______________      |##|       ####               |###|       |###############| |###########/                                                
//      |#|       \#\     |###############| |#|     |##############|      |##|       ########           |###|       |###############| |#|       \#\                                                
//      |#|        \#\    |#|               |#|          |######|         |##|           ########       |###|       |#|               |#|        \#\                          
//      |#|         \#\   |#|               |#|         |######|          |##|               ####       |###|       |#|               |#|         \#\                            
//      |#|          \#\  |###############| |#|##############|       |####|##|###|  |############       |###|       |###############| |#|          \#\                                         
//      |#|           \#\ |###############| |#|##########|           |####|##|###|  |############       |###|       |###############| |#|           \#\                                                 
//________________________________________________________________________________________________________________________________________________________

const Register = () => {

    let [username, setUsername] = useState('1');
    let [displayName, setDisplayName] = useState('1');

    const router = useRouter();

    const [log, setLog] = useState('');
    const [isLogVisible, setLogVisible] = useState(false);

    const [err, setErr] = useState(null);

    const videoRef = useRef(null);

    //  face descriptors
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const [smileDescriptor, setSmileDescriptor] = useState(null);
    const [gloomyDescriptor, setGloomyDescriptor] = useState(null);


    //  ------------------------------------------------------------------------------------------------------- //


    //  Cam setup
    useEffect(() => {
        loadModels();
        const setupCamera = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
            videoRef.current.srcObject = stream;
            return new Promise((resolve) => {
                videoRef.current.onloadedmetadata = () => {
                    resolve(videoRef.current);
                };
            });
        };
        setupCamera();
    }, []);


    const blockCapturer = async () => {
        setErr(null);

        document.getElementById('capture-btn-id').innerText = 'Capturing...';

        const video = videoRef.current;
        video.pause();

        await new Promise(resolve => setTimeout(resolve, 0));
    };

    const unblockCapturer = async () => {
        document.getElementById('capture-btn-id').innerText = 'Capture face';

        const video = videoRef.current;
        video.play();

        await new Promise(resolve => setTimeout(resolve, 0));
    };

    //  Capture image and save descriptor
    const handleCapture = async () => {
        await blockCapturer();

        const video = await videoRef.current;
        const detection = await faceapi.detectSingleFace(video)
            .withFaceLandmarks()
            .withFaceExpressions()
            .withFaceDescriptor();

        if (detection) {
            const descriptor = detection.descriptor;    // first face vector
            const expressions = detection.expressions;

            if (!faceDescriptor)
                setFaceDescriptor(descriptor);              // save the vector
            else if (!smileDescriptor) {
                if (expressions.happy < 0.5) { setErr('No smile detected.'); await unblockCapturer(); return; }
                setSmileDescriptor(descriptor);
            }
            else if (!gloomyDescriptor) {
                if (expressions.sad < 0.5) { setErr('No gloom detected.'); await unblockCapturer(); return; }
                setGloomyDescriptor(descriptor);
            }

            setLog(prev => prev + `\nFace descriptor: ${JSON.stringify(descriptor, null, 2)}\n`);

        }
        else {
            //setLog(prev => prev + "No face detected.\n");
            setErr("No face detected.");
        }

        await unblockCapturer();
    };

    //  register req to server
    const handleRegister = async () => {
        setLog((prev) => "Registration button pressed.\n");

        if (username.length < 1 || displayName.length < 1) {
            setLog((prev) => prev + "Please, enter Usernames.\n");
            return;
        }

        if (!window.PublicKeyCredential) {
            setLog((prev) => prev + "WebAuthn not supported by this browser.\n");
            return;
        }

        // 1: Get challenge from backend
        try {
            const response = await fetch('/api/auth/register/challenge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, displayName }),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error(`Get challenge error: ${response.statusText}`);
            }

            setLog((prev) => prev + "Get challenge: Ok.\n");

            const response_data = await response.json();

            const jwt = response_data.jwt;
            if (jwt) {
                localStorage.setItem('jwt', jwt);
                setLog((prev) => prev + "JWT saved.\n");
            }
            else {
                throw new Error("No JWT!");
            }


            const options = response_data.options;
            options.challenge = base64UrlToBuffer(options.challenge);
            options.user.id = base64UrlToBuffer(options.user.id);

            options.authenticatorSelection = {
                userVerification: "preferred",
            };
            options.rp = {
                name: "localhost",
                id: frontend_domain
            }

            setLog((prev) => prev + "Data convertion: Ok.\n");

            // 2: Call WebAuthn API to create credentials
            const credential = await navigator.credentials.create({
                publicKey: options
            });

            setLog((prev) => prev + "Credential creation: Ok.\n");
            setLog((prev) => prev + `\nCredential: ${JSON.stringify(credential.id, null, 2)}\n`);


            // Convert data for server
            const attestationResponse = {
                id: bufferToBase64Url(credential.rawId),
                rawId: bufferToBase64Url(credential.rawId),
                response: {
                    attestationObject: bufferToBase64Url(credential.response.attestationObject),
                    clientDataJSON: bufferToBase64Url(credential.response.clientDataJSON),
                },
                type: credential.type,
            };

            // 3: Send data to server for verifying
            const verifyReqBody = {
                attestationResponse: attestationResponse,
                faceDescriptor: JSON.stringify(faceDescriptor),
                smileDescriptor: JSON.stringify(smileDescriptor),
                gloomyDescriptor: JSON.stringify(gloomyDescriptor)
            }

            setLog(prev => prev + `\n\nverifyReqBody:\n${JSON.stringify(verifyReqBody)}\n\n`);

            const verifyResponse = await fetch(`/api/auth/register/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
                },
                body: JSON.stringify(verifyReqBody),
                credentials: 'include',
            });



            if (!verifyResponse.ok) {
                throw new Error(`Verify error: ${JSON.stringify(verifyResponse)}`);
            }

            const verifyResult = await verifyResponse.json();
            console.log(verifyResult);
            setLog((prev) => prev + "Verifying result: " + JSON.stringify(verifyResult) + "\n");

        } catch (error) {
            setLog((prev) => prev + "Error: " + error.message + "\n");
        }
    };









    return (
        <div className='main-container'>
            <div className='wrapper'>
                <h1>Register</h1>
                <p className='input-sign'>Username</p>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className='inputs'
                />
                <p className='input-sign'>Display name</p>
                <input
                    type="text"
                    placeholder="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className='inputs'
                />

                {/*  Show face descriptors captuding states  */}
                {faceDescriptor && (
                    <p style={{ alignSelf: 'end', color: 'green' }}>Face (normal) descriptor captured!</p>
                )}
                {smileDescriptor && (
                    <p style={{ alignSelf: 'end', color: 'green' }}>Face (smiling) descriptor captured!</p>
                )}
                {gloomyDescriptor && (
                    <p style={{ alignSelf: 'end', color: 'green' }}>Face (gloomy) descriptor captured!</p>
                )}

                {(!faceDescriptor || !smileDescriptor || !gloomyDescriptor) && (
                    <>
                        <p className='input-sign' style={{ color: 'rgb(255, 165, 0)', fontSize: '18px' }}>
                            {
                                !faceDescriptor ? "Face (normal)" :
                                    !smileDescriptor ? "Face (smiling)" :
                                        "Face (gloomy)"
                            }
                        </p>
                        <video
                            id='face-frame-id'
                            ref={videoRef}
                            autoPlay
                            style={{
                                width: '300px',
                                height: 'auto',
                                border: '2px solid black',
                                borderRadius: '20px',
                                transform: 'scaleX(-1)'
                            }}
                        />
                        {err != null && (
                            <p style={{ width: '100%', textAlign: 'right', color: 'red', textDecoration: 'underline' }}>{err}</p>
                        )}
                    </>
                )}



                {(!faceDescriptor || !smileDescriptor || !gloomyDescriptor) && (
                    <button
                        onClick={handleCapture}
                        className='action-button'
                        id='capture-btn-id'
                    >
                        Capture Face
                    </button>
                )}

                {(faceDescriptor && smileDescriptor && gloomyDescriptor) && (
                    <button onClick={handleRegister} className='action-button'>Register</button>
                )}

                <a onClick={() => router.push('/signin/device')} className='go-register-button'>
                    Go to Sign In
                </a>

                <a onClick={() => setLogVisible(!isLogVisible)} className='switch-log'>
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
            </div>
        </div>
    );
};

export default Register;
