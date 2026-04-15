@echo off
echo Downloading Face-API.js Models...
echo.

REM Ensure we're in the project root
cd /d "%~dp0"

REM Create models directory if it doesn't exist
if not exist "frontend\public\models" (
    mkdir "frontend\public\models"
    echo Created models directory
)

REM Change to models directory
cd "frontend\public\models"

echo Downloading model files...
echo.

powershell -Command "& {Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json' -OutFile 'tiny_face_detector_model-weights_manifest.json'}"
echo Downloaded: tiny_face_detector_model-weights_manifest.json

powershell -Command "& {Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1' -OutFile 'tiny_face_detector_model-shard1'}"
echo Downloaded: tiny_face_detector_model-shard1

powershell -Command "& {Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json' -OutFile 'face_landmark_68_model-weights_manifest.json'}"
echo Downloaded: face_landmark_68_model-weights_manifest.json

powershell -Command "& {Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1' -OutFile 'face_landmark_68_model-shard1'}"
echo Downloaded: face_landmark_68_model-shard1

powershell -Command "& {Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json' -OutFile 'face_recognition_model-weights_manifest.json'}"
echo Downloaded: face_recognition_model-weights_manifest.json

powershell -Command "& {Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1' -OutFile 'face_recognition_model-shard1'}"
echo Downloaded: face_recognition_model-shard1

powershell -Command "& {Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2' -OutFile 'face_recognition_model-shard2'}"
echo Downloaded: face_recognition_model-shard2

powershell -Command "& {Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-weights_manifest.json' -OutFile 'face_expression_model-weights_manifest.json'}"
echo Downloaded: face_expression_model-weights_manifest.json

powershell -Command "& {Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_expression_model-shard1' -OutFile 'face_expression_model-shard1'}"
echo Downloaded: face_expression_model-shard1

echo.
echo SUCCESS: All Face-API.js models downloaded!
echo You can now use offline face detection.
echo.
pause