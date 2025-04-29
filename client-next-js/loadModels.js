import * as faceapi from 'face-api.js';

async function loadModels() {
    // Загрузка моделей
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models/face_landmark_68_model-weights_manifest.json');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models/face_recognition_model-weights_manifest.json');
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models/ssd_mobilenetv1_model-weights_manifest.json');
    await faceapi.nets.faceExpressionNet.loadFromUri('/models/face_expression_model-weights_manifest.json');

    console.log('Models loaded successfully');
}

// Экспорт функции для использования в других частях приложения
export { loadModels };
