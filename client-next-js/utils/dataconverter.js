export const base64UrlToBuffer = (base64Url) => {
    if (!base64Url) {
        console.error("Base64 string is empty or undefined:", base64Url);
        return new ArrayBuffer(0);
    }

    // Заменяем символы для base64
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad > 0) {
        base64 += '='.repeat(4 - pad);
    }
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
};

// Конвертация Uint8Array в base64url
export const bufferToBase64Url = (buffer) => {
    let base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};