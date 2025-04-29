import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import QRCode from 'react-qr-code';

import * as faceapi from 'face-api.js';
import { loadModels } from '../../loadModels.js';
import '../css/styles.css';

//___________________________________________________________________________
//                                                                           |                               
//       |##|##########|     |#####|       |##########     |##|#########|    |                                                                                                            
//       |##|##########|     |#####|       |############|  |##|#########|    |                                                                                                      
//       |##|               |##   ##|      |###       ##|  |##|              |              
//       |##|               |##   ##|      |###            |##|              |                 
//       |##|##########|   |#########|     |###            |##|#########|    |                                                                          
//       |##|##########|   |#########|     |###            |##|#########|    |                                                                          
//       |##|             |##       ##|    |###            |##|              |                                
//       |##|             |##       ##|    |###       ##|  |##|              |                                      
//       |##|             |##       ##|    |############|  |##|#########|    |                                                                     
//       |##|             |##       ##|    |##########     |##|#########|    |                                                                           
//___________________________________________________________________________|




const SignInFace = () => {
    let [username, setUsername] = useState('1');

    const [log, setLog] = useState('');

    const router = useRouter();

    const [isLogVisible, setLogVisible] = useState(false);

    const [err, setErr] = useState(null);
    const videoRef = useRef(null);
    
    //  face descriptors
    const [faceDescriptor, setFaceDescriptor] = useState(null);
    const [smileDescriptor, setSmileDescriptor] = useState(null);
    const [gloomyDescriptor, setGloomyDescriptor] = useState(null);

    // first load
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

    //  sign-in req to server
    const handleSignIn = async () => {
        try {
            setLog(prev => prev + `\nFace descriptor:\n${JSON.stringify(faceDescriptor)}\n`);
            const reqBody = {
                username: username,
                faceDescriptor: JSON.stringify(faceDescriptor),
                smileDescriptor: JSON.stringify(smileDescriptor),
                gloomyDescriptor: JSON.stringify(gloomyDescriptor)
            };

            setLog(prev => prev + `\nReq: ${JSON.stringify(reqBody)}\n`);

            const response = await fetch('/api/auth/login/face', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reqBody),
                credentials: 'include',
            });

            if (!response.ok) throw new Error(`Get response error: ${response.statusText}`);

            const response_data = await response.json();
            setLog(prev => prev + `\nResponse: ${JSON.stringify(response)}\n`);

            if (response_data.success == true) {

                //  SAVE JWT
                const token = response_data.jwt;
                localStorage.setItem("authorizedUser", token);

                router.push('/user/account');
            }
            else {
                setLog(x => x + `error: ${response_data.error}`);
            }
        }
        catch (error) {
            setLog((prev) => prev + "Error: " + error.message + "\n");
        }
    };


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

    return (
        <div style={{
            width: '100%',
            padding: '20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxSizing: 'border-box',
            margin: 0
        }}>
            <div style={{
                display: 'flex',
                width: 'max-content',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '400px',
                margin: '0px',
                padding: '50px',
                border: '2px solid rgba(100,100,100,.3)',
                borderRadius: '20px',
            }}>
                <h1>Sign In</h1>

                <p style={{
                    alignSelf: 'start',
                    margin: '0 0 0 20px',
                    padding: 0,
                    fontSize: '14px'
                }}>Username</p>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                        fontSize: '16px',
                        margin: '10px',
                        padding: '10px',
                        width: '300px',
                        borderRadius: '30px'
                    }}
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
                    <button onClick={handleCapture} className='action-button' id='capture-btn-id'>
                        Capture Face
                    </button>
                )}

                {(faceDescriptor && smileDescriptor && gloomyDescriptor) && (
                    <button onClick={handleSignIn} className='action-button'>
                        Sign In
                    </button>
                )}

                <a
                    onClick={() => router.push('/register')}
                    style={{
                        fontSize: '18 px',
                        border: '1px solid gray',
                        borderRadius: '5px',
                        margin: '10px',
                        padding: '10px',
                        width: '150px',
                        textAlign: 'center',
                        cursor: 'pointer'
                    }}
                >
                    Go to Register
                </a>

                <a
                    onClick={() => setLogVisible(!isLogVisible)}
                    style={{
                        fontSize: '16px',
                        margin: '2px',
                        padding: '2px',
                        width: '100px',
                        textAlign: 'center',
                        cursor: 'pointer',  
                        textDecoration: 'underline',
                        userSelect: 'none'
                    }}
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
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    alignSelf: 'center',
                    justifyContent: 'space-between'
                }}>
                    <a className='button-a' onClick={() => router.push('/signin/device')}>Using FIDO device</a>
                    <a className='button-a' onClick={() => router.push('/signin/qr')}>Using QR-code</a>
                </div>
            </div>
        </div>
    );
};

export default SignInFace;
