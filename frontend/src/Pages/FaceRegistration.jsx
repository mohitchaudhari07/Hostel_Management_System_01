import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import axios from "axios";

function FaceRegistration() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState("Initializing...");
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [modelsActuallyLoaded, setModelsActuallyLoaded] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [detectedFace, setDetectedFace] = useState(false);
  const [faceConfidence, setFaceConfidence] = useState(0);
  const [studentList, setStudentList] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [fastMode, setFastMode] = useState(true);
  const detectionCounterRef = useRef(0);
  const autoRegisterRef = useRef(null);
  const lastDescriptorRef = useRef(null);
  const failedDetectionsRef = useRef(0);

  // Load face-api models with timeout
  useEffect(() => {
    let timeoutId = null;
    
    const loadModels = async () => {
      try {
        timeoutId = setTimeout(() => {
          if (!modelsLoaded) {
            console.warn("Model loading timeout after 45 seconds");
            setLoadingTimeout(true);
            setLoadingProgress("❌ Models taking too long to load...");
          }
        }, 45000);

        const modelsPaths = [
          "/", // Try local models first (offline)
          "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/",
          "https://unpkg.com/face-api.js@0.22.2/weights/",
          "https://cdnjs.cloudflare.com/ajax/libs/face-api.js/0.22.2/weights/",
        ];

        let loaded = false;
        let lastError = null;

        for (let i = 0; i < modelsPaths.length; i++) {
          const modelsPath = modelsPaths[i];
          const isLocal = modelsPath === "/";
          const displayName = isLocal ? "Local Offline Models" : modelsPath.split('//')[1].split('/')[0];
          
          try {
            setLoadingProgress(`Loading from ${displayName} (${i + 1}/${modelsPaths.length})...`);
            console.log("Loading models from:", modelsPath);
            
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Load Timeout")), 30000)
            );

            await Promise.race([
              (async () => {
                console.log("Loading tinyFaceDetector...");
                await faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath);
                console.log("Loading faceLandmark68Net...");
                await faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath);
                console.log("Loading faceRecognitionNet...");
                await faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath);
                console.log("Loading faceExpressionNet...");
                await faceapi.nets.faceExpressionNet.loadFromUri(modelsPath);
              })(),
              timeoutPromise,
            ]);

            console.log("✅ Models loaded successfully from:", modelsPath);
            setLoadingProgress(isLocal ? "✅ Models loaded! (Offline Mode - Fastest!)" : "✅ Models loaded! (Online Mode)");
            clearTimeout(timeoutId);
            setModelsLoaded(true);
            setModelsActuallyLoaded(true);
            loaded = true;
            break;
          } catch (error) {
            const source = isLocal ? "Local" : `CDN ${i}`;
            console.warn(`❌ Failed from ${source}:`, error.message);
            setLoadingProgress(`${source} failed: ${error.message.substring(0, 50)}...`);
            lastError = error;
          }
        }

        clearTimeout(timeoutId);
        
        if (!loaded) {
          setLoadingTimeout(true);
          setLoadingProgress(`❌ All sources failed. Error: ${lastError?.message || 'Unknown error'}`);
          console.error("Failed to load from all sources:", lastError);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("Model loading error:", error);
        setLoadingTimeout(true);
        setLoadingProgress("❌ Failed to load models.");
      }
    };

    loadModels();
    fetchStudents();
    fetchRegisteredStudents();

    return () => {
      clearTimeout(timeoutId);
      if (autoRegisterRef.current) clearTimeout(autoRegisterRef.current);
    };
  }, []);

  // Fetch all students without face registration
  const fetchStudents = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/auth/students");
      // Fix: Filter students without face registration
      const unregisteredStudents = response.data.filter(
        (student) => !student.faceRegistered // Changed from !student.faceDescriptor
      );
      setStudentList(unregisteredStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  // Fetch registered students
  const fetchRegisteredStudents = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/attendance/face-registered");
      setRegisteredStudents(response.data);
    } catch (error) {
      console.error("Error fetching registered students:", error);
    }
  };

  // Clear canvas drawing
  const clearCanvas = () => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  // Detect face and auto-capture descriptor with improved algorithm
  const detectFace = async () => {
    if (!webcamRef.current || !modelsLoaded || !webcamRef.current.video) return;

    // If models were skipped, don't try to detect faces
    if (!modelsActuallyLoaded) {
      setMessage("⚠️ Face detection disabled - models not loaded. Use manual registration or reload to enable face detection.");
      return;
    }

    try {
      const video = webcamRef.current.video;
      
      // Ensure video is ready and has valid dimensions
      if (video.readyState !== 4 || !video.videoWidth || !video.videoHeight) return;

      // Try with different detection options for better reliability
      let detections = null;
      
      try {
        // Try TinyFaceDetector first (faster)
        detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({
            inputSize: 416, // Standard size
            scoreThreshold: 0.4 // Lower threshold for better detection
          }))
          .withFaceLandmarks()
          .withFaceDescriptors();
      } catch (err) {
        console.warn("TinyFaceDetector failed, trying SSD...", err);
        // Fallback to SSD if TinyFaceDetector fails
        detections = await faceapi
          .detectAllFaces(video)
          .withFaceLandmarks()
          .withFaceDescriptors();
      }

      // Clear canvas first
      clearCanvas();

      if (!detections || detections.length === 0) {
        setDetectedFace(false);
        detectionCounterRef.current = 0;
        failedDetectionsRef.current += 1;
        
        // Give helpful tips after multiple failed attempts
        if (failedDetectionsRef.current > 10) {
          setMessage("💡 Tips: Better lighting? Face straight at camera? University 30cm away?");
          failedDetectionsRef.current = 0; // Reset counter
        } else {
          setMessage("⏳ Detecting face... (ensure good lighting)");
        }
        return;
      }

      // Reset failed detection counter on success
      failedDetectionsRef.current = 0;

      if (detections.length > 1) {
        setDetectedFace(false);
        detectionCounterRef.current = 0;
        setMessage("⚠️ Multiple faces detected! Only one person in frame please.");
        return;
      }

      // Validate detection quality
      const detection = detections[0];
      if (!detection.descriptor || detection.descriptor.length !== 128) {
        setDetectedFace(false);
        detectionCounterRef.current = 0;
        setMessage("⚠️ Face quality too low. Better lighting needed.");
        return;
      }

      // Draw face detection
      const displaySize = {
        width: video.videoWidth,
        height: video.videoHeight,
      };

      // Match canvas size to video
      if (canvasRef.current) {
        try {
          faceapi.matchDimensions(canvasRef.current, displaySize);
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          
          // Draw with colors
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        } catch (drawErr) {
          console.warn("Drawing error (non-critical):", drawErr);
        }
      }

      const descriptor = detection.descriptor;
      const confidence = Math.round(detection.detection.score * 100);
      
      // Store descriptor in both state and ref
      const descriptorArray = Array.from(descriptor);
      setFaceDescriptor(descriptorArray);
      lastDescriptorRef.current = descriptorArray;
      setFaceConfidence(confidence);
      setDetectedFace(true);

      // Count consecutive detections (need 3+ for stability = ~1.5 seconds)
      detectionCounterRef.current += 1;

      if (detectionCounterRef.current >= 3) {
        // Only show "Face locked" and attempt auto-register if student is selected
        if (selectedStudent) {
          setMessage("✅ Face locked! Auto-registering in 2 seconds...");
          
          // Auto-register if in fast mode AND student selected
          if (fastMode && !autoRegisterRef.current) {
            // Clear any existing timeout
            if (autoRegisterRef.current) {
              clearTimeout(autoRegisterRef.current);
            }
            
            autoRegisterRef.current = setTimeout(() => {
              // Use the ref value to ensure we have the latest descriptor
              if (lastDescriptorRef.current && selectedStudent) {
                handleAutoRegister(lastDescriptorRef.current, selectedStudent);
              }
              autoRegisterRef.current = null;
            }, 2000);
          }
        } else if (!fastMode) {
          setMessage("✅ Face detected! Select student and click Register Face.");
        } else {
          // FastMode but no student selected - keep waiting
          setMessage("⏳ Select a student to auto-register...");
          detectionCounterRef.current = 2; // Keep just below 3 so it doesn't keep saying locked
        }
      } else {
        setMessage(`⏳ Stabilizing face detection (${detectionCounterRef.current}/3)... Confidence: ${confidence}%`);
      }
    } catch (error) {
      console.error("Error detecting face:", error);
      setDetectedFace(false);
      detectionCounterRef.current = 0;
      setMessage("❌ Face detection error. Refresh page if persists.");
    }
  };

  // Auto-register function (for fast mode)
  const handleAutoRegister = async (descriptor, studentId) => {
    // Prevent multiple simultaneous registrations
    if (loading) return;
    
    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/attendance/register-face",
        {
          studentId: studentId,
          faceDescriptor: descriptor,
        }
      );

      setRegistrationCount(prev => prev + 1);
      setMessage("✅ Registration successful! Moving to next student...");
      
      // Reset for next student
      setFaceDescriptor(null);
      lastDescriptorRef.current = null;
      setDetectedFace(false);
      setSelectedStudent("");
      detectionCounterRef.current = 0;

      // Refresh lists and auto-select next student
      await fetchStudents();
      await fetchRegisteredStudents();
      
      // Auto-select next available student
      const updatedStudentList = await axios.get("http://localhost:5000/api/auth/students");
      const unregisteredStudents = updatedStudentList.data.filter(
        (student) => !student.faceRegistered
      );
      
      if (unregisteredStudents.length > 0) {
        // Auto-select the next student
        setSelectedStudent(unregisteredStudents[0]._id);
        setMessage(`✅ Ready for next student: ${unregisteredStudents[0].name}`);
      } else {
        setMessage("✅ All students registered! Great job!");
      }
      
    } catch (error) {
      console.error("Auto-registration failed:", error);
      setMessage("❌ " + (error.response?.data?.message || "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  // Auto-detect every 500ms when capturing
  useEffect(() => {
    if (!capturing || !modelsLoaded) return;

    let intervalId;
    
    const startDetection = () => {
      intervalId = setInterval(detectFace, 500);
    };

    // Small delay to ensure video is ready
    setTimeout(startDetection, 1000);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (autoRegisterRef.current) {
        clearTimeout(autoRegisterRef.current);
        autoRegisterRef.current = null;
      }
    };
  }, [capturing, modelsLoaded]);

  // Handle student selection changes while capturing
  useEffect(() => {
    if (capturing && selectedStudent && detectionCounterRef.current >= 3 && !autoRegisterRef.current && fastMode) {
      // Student just selected and we already have a stable face - auto-register immediately
      setMessage("✅ Face locked! Auto-registering in 2 seconds...");
      autoRegisterRef.current = setTimeout(() => {
        if (lastDescriptorRef.current && selectedStudent) {
          handleAutoRegister(lastDescriptorRef.current, selectedStudent);
        }
        autoRegisterRef.current = null;
      }, 2000);
    }
  }, [selectedStudent, capturing, fastMode]);

  // Manual registration (for normal mode)
  const handleRegisterFace = async () => {
    if (!selectedStudent) {
      setMessage("❌ Please select a student.");
      return;
    }

    if (!faceDescriptor && !lastDescriptorRef.current) {
      setMessage("❌ Please capture a face image first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("⏳ Registering face...");

      const descriptorToUse = faceDescriptor || lastDescriptorRef.current;

      const response = await axios.post(
        "http://localhost:5000/api/attendance/register-face",
        {
          studentId: selectedStudent,
          faceDescriptor: descriptorToUse,
        }
      );

      setRegistrationCount(prev => prev + 1);
      setMessage("✅ " + response.data.message);
      setSelectedStudent("");
      setFaceDescriptor(null);
      lastDescriptorRef.current = null;
      setDetectedFace(false);
      detectionCounterRef.current = 0;

      // Refresh student lists
      await fetchStudents();
      await fetchRegisteredStudents();

    } catch (error) {
      console.error("Error registering face:", error);
      setMessage(
        "❌ " + (error.response?.data?.message || "Failed to register face")
      );
    } finally {
      setLoading(false);
    }
  };

  // Remove face registration
  const handleRemoveFace = async (studentId) => {
    if (!confirm("Remove face registration for this student?")) return;

    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:5000/api/attendance/remove-face",
        { studentId }
      );

      setMessage("✅ " + response.data.message);
      await fetchStudents();
      await fetchRegisteredStudents();
    } catch (error) {
      console.error("Error removing face:", error);
      setMessage(
        "❌ " + (error.response?.data?.message || "Failed to remove face")
      );
    } finally {
      setLoading(false);
    }
  };

  // Start camera handler
  const handleStartCamera = () => {
    if (!selectedStudent && fastMode) {
      setMessage("⚠️ Please select a student BEFORE starting camera in Fast Mode.");
      return;
    }
    setCapturing(true);
    setDetectedFace(false);
    setFaceDescriptor(null);
    lastDescriptorRef.current = null;
    detectionCounterRef.current = 0;
    failedDetectionsRef.current = 0;
    setMessage("");
  };

  // Stop camera handler
  const handleStopCamera = () => {
    setCapturing(false);
    if (autoRegisterRef.current) {
      clearTimeout(autoRegisterRef.current);
      autoRegisterRef.current = null;
    }
    detectionCounterRef.current = 0;
    failedDetectionsRef.current = 0;
    clearCanvas();
  };

  return (
    <div style={styles.container}>
      {/* Left Panel - Registration */}
      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>📸 Face Registration</h2>
          <p style={styles.panelSubtitle}>Capture and register student faces</p>
        </div>

        {!modelsLoaded ? (
          <div style={{ ...styles.loadingBox, minHeight: "400px" }}>
            <div style={styles.spinner}></div>
            <p style={{ marginTop: "20px", fontSize: "16px", fontWeight: "500" }}>
              {loadingProgress}
            </p>
            <p style={{ marginTop: "10px", fontSize: "14px", color: "#666", textAlign: "center" }}>
              This may take up to 60 seconds on first load...
            </p>
            {loadingTimeout && (
              <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#fff3cd", borderRadius: "8px" }}>
                <p style={{ color: "#856404", marginBottom: "15px", fontWeight: "bold" }}>
                  ⚠️ Models are taking longer than expected.
                </p>
                <div style={{ fontSize: "13px", color: "#856404", marginBottom: "15px" }}>
                  <p style={{ marginBottom: "10px" }}><strong>Solutions:</strong></p>
                  <ol style={{ marginLeft: "20px", marginBottom: "15px" }}>
                    <li><strong>Download offline models (FASTEST)</strong>
                      <div style={{ fontSize: "12px", marginTop: "5px", background: "#fff", padding: "10px", borderRadius: "4px" }}>
                        <p style={{ margin: "0 0 8px 0" }}>Run this in PowerShell (project root):</p>
                        <code style={{ 
                          display: "block", 
                          background: "#f0f0f0", 
                          padding: "8px", 
                          borderRadius: "4px",
                          fontFamily: "monospace",
                          wordBreak: "break-all"
                        }}>
                          .\download-models-fixed.ps1
                        </code>
                        <p style={{ margin: "8px 0 0 0", fontSize: "11px", color: "#666" }}>
                          ✅ Models downloaded to frontend/public/ - face detection works offline!
                        </p>
                      </div>
                    </li>
                    <li style={{ marginTop: "10px" }}>Slow internet connection - try again in a moment</li>
                    <li style={{ marginTop: "10px" }}>CDN is blocked in your region - use offline models above</li>
                    <li style={{ marginTop: "10px" }}>Browser cache issues - clear cache (Ctrl+Shift+Del)</li>
                  </ol>
                </div>
                
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#ffc107",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      marginRight: "10px",
                      fontWeight: "bold"
                    }}
                  >
                    🔄 Refresh Page
                  </button>
                  <button
                    onClick={() => {
                      setModelsLoaded(true);
                      setLoadingTimeout(false);
                      setModelsActuallyLoaded(false);
                    }}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#e9ecef",
                      border: "1px solid #dee2e6",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "500"
                    }}
                  >
                    ⏭️ Skip & Continue
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {!modelsActuallyLoaded && (
              <div style={{
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#fff3cd",
                border: "1px solid #ffeaa7",
                borderRadius: "8px",
                textAlign: "center"
              }}>
                <p style={{ color: "#856404", fontWeight: "bold", marginBottom: "10px" }}>
                  ⚠️ Face Detection Models Not Loaded
                </p>
                <p style={{ color: "#856404", fontSize: "14px", marginBottom: "15px" }}>
                  Camera will open but face detection won't work. You can still register faces manually by entering descriptors, or fix the models:
                </p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#ffc107",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold"
                    }}
                  >
                    🔄 Reload & Try Models
                  </button>
                  <button
                    onClick={() => {
                      const cmd = 'cd frontend\\public\\models && Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json" -OutFile "tiny_face_detector_model-weights_manifest.json"';
                      navigator.clipboard.writeText(cmd);
                      alert('Command copied to clipboard. Run it in PowerShell in the project root.');
                    }}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#17a2b8",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      color: "white"
                    }}
                  >
                    📥 Download Models
                  </button>
                </div>
              </div>
            )}

            {/* Webcam Section */}
            <div style={styles.webcamContainer}>
              {capturing && (
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                  }}
                  audio={false}
                  style={styles.webcam}
                  mirrored={true}
                  onUserMediaError={() => {
                    setMessage("❌ Camera access denied. Check browser permissions.");
                    setCapturing(false);
                  }}
                />
              )}
              <canvas
                ref={canvasRef}
                style={{
                  ...styles.canvas,
                  display: capturing ? "block" : "none",
                  position: "absolute",
                  top: "0",
                  left: "0",
                  width: "100%",
                  height: "100%"
                }}
              />
              {!capturing && (
                <div style={styles.noWebcam}>
                  <div style={styles.noWebcamIcon}>📹</div>
                  <p>Camera is off. Click "Start Camera" to begin.</p>
                </div>
              )}
            </div>

            {/* Face Status */}
            {capturing && (
              <div
                style={{
                  ...styles.statusBox,
                  ...(detectedFace ? styles.statusSuccess : styles.statusWarning),
                }}
              >
                {detectedFace ? `✅ Face detected (${faceConfidence}% confidence)` : "⏳ Detecting face..."}
              </div>
            )}

            {/* Message Box */}
            {message && (
              <div
                style={{
                  ...styles.messageBox,
                  ...(message.includes("✅") ? styles.messageSuccess : {}),
                  ...(message.includes("❌") ? styles.messageError : {}),
                  ...(message.includes("⏳") ? styles.messageInfo : {}),
                }}
              >
                {message}
              </div>
            )}

            {/* Controls */}
            <div style={styles.controls}>
              <button
                style={{
                  ...styles.btn,
                  ...(capturing ? styles.btnDanger : styles.btnPrimary),
                }}
                onClick={capturing ? handleStopCamera : handleStartCamera}
                disabled={loading}
              >
                {capturing ? "🛑 Stop Camera" : "🎥 Start Camera"}
              </button>

              {!fastMode && (
                <button
                  style={{
                    ...styles.btn,
                    ...styles.btnPrimary,
                    opacity: capturing && detectedFace ? 1 : 0.5,
                  }}
                  onClick={() => {
                    if (detectedFace && lastDescriptorRef.current) {
                      setMessage("✅ Face captured! Now select a student and click Register Face.");
                    } else {
                      setMessage("⚠️ No face detected yet. Keep your face in frame and try again.");
                    }
                  }}
                  disabled={!capturing || !detectedFace || loading}
                >
                  {lastDescriptorRef.current ? "✨ Face Captured ✓" : "📸 Capture Face"}
                </button>
              )}

              {!fastMode && (
                <button
                  style={{
                    ...styles.btn,
                    ...styles.btnSuccess,
                    opacity: (faceDescriptor || lastDescriptorRef.current) && selectedStudent ? 1 : 0.5,
                  }}
                  onClick={handleRegisterFace}
                  disabled={(!faceDescriptor && !lastDescriptorRef.current) || !selectedStudent || loading}
                >
                  {loading ? "⏳ Registering..." : "✨ Register Face"}
                </button>
              )}

              <button
                style={{
                  ...styles.btn,
                  backgroundColor: fastMode ? "#4CAF50" : "#9E9E9E",
                  opacity: 1,
                }}
                onClick={() => setFastMode(!fastMode)}
                disabled={capturing}
              >
                {fastMode ? "⚡ Fast Mode ON" : "🐢 Fast Mode OFF"}
              </button>
            </div>

            {/* Fast Mode Instructions */}
            <div style={{
              marginTop: "20px",
              padding: "15px",
              backgroundColor: fastMode ? "#c8e6c9" : "#e7f3ff",
              borderRadius: "8px",
              borderLeft: `4px solid ${fastMode ? "#4CAF50" : "#2196F3"}`
            }}>
              <p style={{ fontWeight: "bold", marginBottom: "10px", color: fastMode ? "#2e7d32" : "#1976D2" }}>
                {fastMode ? "⚡ FAST MODE ENABLED" : "📋 Normal Mode"}
              </p>
              {fastMode ? (
                <div style={{ color: "#2e7d32", fontSize: "14px" }}>
                  <p style={{ marginBottom: "10px" }}>🚀 Ultra-fast registration!</p>
                  <ol style={{ marginLeft: "20px" }}>
                    <li><strong>Select student FIRST</strong></li>
                    <li>Click "🎥 Start Camera"</li>
                    <li>Face auto-detects → <strong>Auto-registers in 2 seconds!</strong></li>
                    <li>Ready for next student instantly</li>
                  </ol>
                  <p style={{ fontSize: "12px", marginTop: "10px", color: "#1b5e20" }}>
                    ✨ ~15-20 seconds per student (vs 30-60 seconds)
                  </p>
                </div>
              ) : (
                <ol style={{ marginLeft: "20px", color: "#555", fontSize: "14px" }}>
                  <li>Click <strong>"🎥 Start Camera"</strong></li>
                  <li>Position face in good lighting</li>
                  <li>Wait for <strong>"✅ Face detected"</strong></li>
                  <li>Click <strong>"📸 Capture Face"</strong></li>
                  <li>Select student from dropdown</li>
                  <li>Click <strong>"✨ Register Face"</strong></li>
                </ol>
              )}
            </div>

            {/* Statistics */}
            <div style={{
              marginTop: "15px",
              padding: "12px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              <p style={{ fontSize: "12px", color: "#666", margin: "0 0 8px 0" }}>Registered this session:</p>
              <p style={{ fontSize: "24px", fontWeight: "bold", color: "#4CAF50", margin: 0 }}>
                {registrationCount}
              </p>
            </div>

            {/* Student Selection */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Student to Register:</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                style={styles.select}
                disabled={loading}
              >
                <option value="">-- Choose a student --</option>
                {studentList.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} ({student.email})
                  </option>
                ))}
              </select>
              <p style={styles.selectHint}>
                {studentList.length} students waiting • {registeredStudents.length} registered
              </p>
            </div>
          </>
        )}
      </div>

      {/* Right Panel - Registered Students */}
      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>✅ Registered Students</h2>
          <p style={styles.panelSubtitle}>{registeredStudents.length} students</p>
        </div>

        <div style={styles.registeredList}>
          {registeredStudents.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🔍</div>
              <p>No students registered yet</p>
              <p style={styles.emptyHint}>
                Register student faces using the form on the left
              </p>
            </div>
          ) : (
            registeredStudents.map((student) => (
              <div key={student._id} style={styles.registeredCard}>
                <div style={styles.registeredHeader}>
                  <div style={styles.registeredAvatar}>
                    {student.name.split(" ")[0][0]}
                    {student.name.split(" ")[1]?.[0]}
                  </div>
                  <div style={styles.registeredInfo}>
                    <p style={styles.registeredName}>{student.name}</p>
                    <p style={styles.registeredEmail}>{student.email}</p>
                  </div>
                  <button
                    style={styles.removeBtn}
                    onClick={() => handleRemoveFace(student._id)}
                    disabled={loading}
                  >
                    🗑️
                  </button>
                </div>
                <div style={styles.registeredStatus}>
                  <span style={styles.statusBadge}>✅ Face Registered</span>
                  <span style={styles.dateBadge}>
                    📅 {student.faceRegisteredDate ? new Date(student.faceRegisteredDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "30px",
    height: "100%",
  },

  panel: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(20px)",
    borderRadius: "20px",
    padding: "30px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },

  panelHeader: {
    borderBottom: "2px solid rgba(102, 126, 234, 0.2)",
    paddingBottom: "20px",
  },

  panelTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 5px 0",
  },

  panelSubtitle: {
    fontSize: "14px",
    color: "#7f8c8d",
    margin: 0,
  },

  loadingBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    textAlign: "center",
  },

  spinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "20px",
  },

  webcamContainer: {
    position: "relative",
    width: "100%",
    borderRadius: "15px",
    overflow: "hidden",
    background: "#000",
    aspectRatio: "4/3",
  },

  webcam: {
    width: "100%",
    height: "100%",
    borderRadius: "15px",
    objectFit: "cover",
  },

  canvas: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    borderRadius: "15px",
  },

  noWebcam: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "white",
    gap: "10px",
  },

  noWebcamIcon: {
    fontSize: "48px",
  },

  statusBox: {
    padding: "15px",
    borderRadius: "10px",
    textAlign: "center",
    fontWeight: "600",
    fontSize: "16px",
  },

  statusSuccess: {
    background: "linear-gradient(135deg, rgba(39, 174, 96, 0.2), rgba(46, 204, 113, 0.2))",
    color: "#27ae60",
    border: "1px solid rgba(39, 174, 96, 0.5)",
  },

  statusWarning: {
    background: "linear-gradient(135deg, rgba(241, 196, 15, 0.2), rgba(230, 126, 34, 0.2))",
    color: "#f39c12",
    border: "1px solid rgba(241, 196, 15, 0.5)",
  },

  messageBox: {
    padding: "12px 15px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    background: "rgba(52, 152, 219, 0.1)",
    color: "#3498db",
    border: "1px solid rgba(52, 152, 219, 0.3)",
    minHeight: "40px",
    display: "flex",
    alignItems: "center",
  },

  messageSuccess: {
    background: "rgba(39, 174, 96, 0.1)",
    color: "#27ae60",
    border: "1px solid rgba(39, 174, 96, 0.3)",
  },

  messageError: {
    background: "rgba(231, 76, 60, 0.1)",
    color: "#e74c3c",
    border: "1px solid rgba(231, 76, 60, 0.3)",
  },

  messageInfo: {
    background: "rgba(52, 152, 219, 0.1)",
    color: "#3498db",
    border: "1px solid rgba(52, 152, 219, 0.3)",
  },

  controls: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  },

  btn: {
    padding: "12px 20px",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },

  btnPrimary: {
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
  },

  btnDanger: {
    background: "linear-gradient(135deg, #e74c3c, #c0392b)",
    color: "white",
  },

  btnSuccess: {
    background: "linear-gradient(135deg, #27ae60, #2ecc71)",
    color: "white",
  },

  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  label: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#2c3e50",
  },

  select: {
    padding: "12px 15px",
    borderRadius: "10px",
    border: "2px solid #e1e8ed",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.3s ease",
  },

  selectHint: {
    fontSize: "13px",
    color: "#7f8c8d",
    margin: "5px 0 0 0",
  },

  registeredList: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    textAlign: "center",
    color: "#7f8c8d",
  },

  emptyIcon: {
    fontSize: "48px",
    marginBottom: "15px",
  },

  emptyHint: {
    fontSize: "13px",
    color: "#95a5a6",
    margin: "5px 0 0 0",
  },

  registeredCard: {
    background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))",
    padding: "15px",
    borderRadius: "12px",
    border: "1px solid rgba(102, 126, 234, 0.2)",
  },

  registeredHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px",
  },

  registeredAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
  },

  registeredInfo: {
    flex: 1,
  },

  registeredName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#2c3e50",
    margin: "0 0 2px 0",
  },

  registeredEmail: {
    fontSize: "12px",
    color: "#7f8c8d",
    margin: 0,
  },

  removeBtn: {
    background: "transparent",
    border: "1px solid #e74c3c",
    borderRadius: "6px",
    color: "#e74c3c",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },

  registeredStatus: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  statusBadge: {
    background: "rgba(39, 174, 96, 0.2)",
    color: "#27ae60",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
  },

  dateBadge: {
    background: "rgba(52, 152, 219, 0.2)",
    color: "#3498db",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
  },
};

// Add keyframes for spinner animation
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default FaceRegistration;