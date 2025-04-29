import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import QRCode from 'react-qr-code';

const SignInQr = () => {
    const router = useRouter();
    const [qr, setQr] = useState(null);

    // first load
    useEffect(() => {
        getQr();
    }, []);

    const getQr = async () => {
        const response = await fetch('/api/auth/login/getqr', {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();
        setQr(data.qr);
    }

    const handleSignIn = async () => {

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
                <QRCode
                    value={JSON.stringify(qr)} // Преобразуем объект в строку JSON
                    size={256} // Размер QR-кода
                    style={{ maxWidth: '100%' }}
                />

                <button
                    onClick={getQr}
                    style={{
                        marginTop: '20px',
                        width: '256px',
                        fontSize: '16px',
                        padding: '5px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(0,0,200,.25)',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}>
                    Refresh QR-code
                </button>

                <br />
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '100%',
                    alignSelf: 'center',
                    justifyContent: 'space-between'
                }}>
                    <a className='button-a' onClick={() => router.push('/signin/device')}>Using FIDO device</a>
                    <a className='button-a' onClick={() => router.push('/signin/face')}>Using face</a>
                </div>
            </div>
        </div>
    );
};

export default SignInQr;
