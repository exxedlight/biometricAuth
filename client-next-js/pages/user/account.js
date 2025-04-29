import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { jwtDecode } from "jwt-decode";
import QrReader from 'react-qr-scanner';
import QRCode from 'react-qr-code';

const Account = () => {
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const router = useRouter();
    //const [error, setError] = useState('');

    const [buttonText, setButtonText] = useState('Share access');
    const [showScanner, setShowScanner] = useState(false);
    const [qrValue, setQrValue] = useState(''); // Для хранения значения QR-кода

    // Функция для проверки JWT токена
    const checkToken = () => {
        const token = localStorage.getItem('authorizedUser'); // Или получи токен из cookie
        if (token) {
            try {
                // Декодируем токен, чтобы получить информацию о пользователе
                const decodedToken = jwtDecode(token);

                // Проверяем, истек ли срок действия токена
                if (decodedToken.exp * 1000 < Date.now()) {
                    // Если истек, удаляем токен и перенаправляем на страницу входа
                    localStorage.removeItem('authorizedUser');
                    router.push('/signin');
                    //setError("Токен истек");
                } else {
                    // Если токен действителен, устанавливаем имя пользователя
                    setUsername(decodedToken.username);
                    setDisplayName(decodedToken.displayName);
                }
            } catch (err) {
                // Если произошла ошибка при декодировании, удаляем токен и перенаправляем на страницу входа
                localStorage.removeItem('authorizedUser');
                router.push('/signin');
                //setError("Ошибка декодирования");
            }
        } else {
            // Если токен отсутствует, перенаправляем на страницу входа
            router.push('/signin');
            //setError("Нима токена");
        }
    };

    // Используем useEffect для проверки токена при загрузке страницы
    useEffect(() => {
        checkToken();
    }, []); // Пустой массив означает, что эффект сработает только при первой загрузке страницы

    // Функция для обработки результата сканирования
    const handleScan = (data) => {
        if (data) {
            setQrValue(data); // Сохраняем значение QR-кода
            setShowScanner(false); // Скрываем сканер после успешного сканирования
            setButtonText('Share access');
            // Здесь вы можете обработать полученные данные
            console.log("Сканированный QR-код:", data);
        }
    };

    // Функция для обработки ошибок при сканировании
    const handleError = (err) => {
        console.error(err);
    };

    // Функция для открытия сканера
    const handleShareAccess = () => {
        setShowScanner(!showScanner);

        if (showScanner == true) {
            setButtonText('Share access');
        }
        else {
            setButtonText('Cancel');
        }
    };














    return (
        <div style={{
            width: '100vw',
            display: 'flex',
            justifyContent: 'center'
        }}>
            <div style={{
                display: 'flex',
                width: '100%',
                height: 'max-content',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '20px',
                padding: '50px',
                border: '2px solid rgba(100,100,100,.3)',
                borderRadius: '20px'
            }
            }>
                <h1>Account Page</h1>
                <p>Username: {username}</p>
                <p>Display Name: {displayName}</p>

                <button style={{
                    padding: '15px',
                    fontSize: '16px',
                    marginTop: '20px',
                    fontWeight: 'bold',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(0,200,0,.2)',
                    cursor: 'pointer'
                }}
                    onClick={handleShareAccess}
                >
                    {buttonText}
                </button>



                {showScanner && (
                    <QrReader
                        delay={300}
                        onError={handleError}
                        onScan={handleScan}
                        constraints={{
                            audio: false,
                            video: { facingMode: "environment" }
                        }}
                        style={{ width: '100%' }}
                    />
                )}

                {qrValue && <p style={{
                    maxWidth: '100%',
                    wordWrap: 'break-word',
                    textWrap: 'wrap',
                }}>
                    Сканированное значение: {JSON.stringify(qrValue, null, 2)}
                </p>}

            </div>
        </div>
    );
};

export default Account;
