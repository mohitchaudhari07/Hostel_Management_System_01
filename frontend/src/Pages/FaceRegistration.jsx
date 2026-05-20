import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import axios from "axios";
import { motion } from "framer-motion";
import { Camera, CheckCircle, Video, UserPlus, Zap, Trash2, ShieldCheck, Loader2, AlertTriangle, Info, Calendar } from "lucide-react";

export default function FaceRegistration() {
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
  const [fastMode, setFastMode] = useState(true);
  const detectionCounterRef = useRef(0);
  const autoRegisterRef = useRef(null);
  const lastDescriptorRef = useRef(null);
  const failedDetectionsRef = useRef(0);

  useEffect(() => {
    let timeoutId = null;
    const loadModels = async () => {
      try {
        timeoutId = setTimeout(() => {
          if (!modelsLoaded) {
            setLoadingTimeout(true);
            setLoadingProgress("❌ Models taking too long to load...");
          }
        }, 45000);

        const modelsPaths = [
          "/",
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
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Load Timeout")), 30000));
            await Promise.race([
              (async () => {
                await faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath);
                await faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath);
                await faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath);
                await faceapi.nets.faceExpressionNet.loadFromUri(modelsPath);
              })(),
              timeoutPromise,
            ]);
            setLoadingProgress(isLocal ? "✅ Models loaded! (Offline Mode - Fastest!)" : "✅ Models loaded! (Online Mode)");
            clearTimeout(timeoutId);
            setModelsLoaded(true);
            setModelsActuallyLoaded(true);
            loaded = true;
            break;
          } catch (error) {
            const source = isLocal ? "Local" : `CDN ${i}`;
            setLoadingProgress(`${source} failed: ${error.message.substring(0, 50)}...`);
            lastError = error;
          }
        }
        clearTimeout(timeoutId);
        if (!loaded) {
          setLoadingTimeout(true);
          setLoadingProgress(`❌ All sources failed. Error: ${lastError?.message || 'Unknown error'}`);
        }
      } catch (error) {
        clearTimeout(timeoutId);
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

  const fetchStudents = async () => {
    try {
      const response = await axios.get("/auth/students");
      setStudentList(response.data.filter((student) => !student.faceRegistered));
    } catch (error) { console.error("Error fetching students:", error); }
  };

  const fetchRegisteredStudents = async () => {
    try {
      const response = await axios.get("/attendance/face-registered");
      setRegisteredStudents(response.data);
    } catch (error) { console.error("Error fetching registered students:", error); }
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const detectFace = async () => {
    if (!webcamRef.current || !modelsLoaded || !webcamRef.current.video) return;
    if (!modelsActuallyLoaded) {
      setMessage("⚠️ Face detection disabled - models not loaded.");
      return;
    }

    try {
      const video = webcamRef.current.video;
      if (video.readyState !== 4 || !video.videoWidth || !video.videoHeight) return;

      let detections = null;
      try {
        detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.4 })).withFaceLandmarks().withFaceDescriptors();
      } catch (err) {
        detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors();
      }

      clearCanvas();

      if (!detections || detections.length === 0) {
        setDetectedFace(false);
        detectionCounterRef.current = 0;
        failedDetectionsRef.current += 1;
        if (failedDetectionsRef.current > 10) {
          setMessage("💡 Tips: Better lighting? Face straight at camera? 30cm away?");
          failedDetectionsRef.current = 0;
        } else {
          setMessage("⏳ Detecting face... (ensure good lighting)");
        }
        return;
      }

      failedDetectionsRef.current = 0;

      if (detections.length > 1) {
        setDetectedFace(false);
        detectionCounterRef.current = 0;
        setMessage("⚠️ Multiple faces detected! Only one person in frame please.");
        return;
      }

      const detection = detections[0];
      if (!detection.descriptor || detection.descriptor.length !== 128) {
        setDetectedFace(false);
        detectionCounterRef.current = 0;
        setMessage("⚠️ Face quality too low. Better lighting needed.");
        return;
      }

      const displaySize = { width: video.videoWidth, height: video.videoHeight };
      if (canvasRef.current) {
        try {
          faceapi.matchDimensions(canvasRef.current, displaySize);
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        } catch {
          clearCanvas();
        }
      }

      const descriptorArray = Array.from(detection.descriptor);
      setFaceDescriptor(descriptorArray);
      lastDescriptorRef.current = descriptorArray;
      setFaceConfidence(Math.round(detection.detection.score * 100));
      setDetectedFace(true);

      detectionCounterRef.current += 1;

      if (detectionCounterRef.current >= 3) {
        if (selectedStudent) {
          setMessage("✅ Face locked! Auto-registering in 2 seconds...");
          if (fastMode && !autoRegisterRef.current) {
            if (autoRegisterRef.current) clearTimeout(autoRegisterRef.current);
            autoRegisterRef.current = setTimeout(() => {
              if (lastDescriptorRef.current && selectedStudent) {
                handleAutoRegister(lastDescriptorRef.current, selectedStudent);
              }
              autoRegisterRef.current = null;
            }, 2000);
          }
        } else if (!fastMode) {
          setMessage("✅ Face detected! Select student and click Register Face.");
        } else {
          setMessage("⏳ Select a student to auto-register...");
          detectionCounterRef.current = 2;
        }
      } else {
        setMessage(`⏳ Stabilizing face detection (${detectionCounterRef.current}/3)... Confidence: ${Math.round(detection.detection.score * 100)}%`);
      }
    } catch (error) {
      setDetectedFace(false);
      detectionCounterRef.current = 0;
      setMessage("❌ Face detection error. Refresh page if persists.");
    }
  };

  const handleAutoRegister = async (descriptor, studentId) => {
    if (loading) return;
    try {
      setLoading(true);
      await axios.post("/attendance/register-face", { studentId: studentId, faceDescriptor: descriptor });
      setMessage("✅ Registration successful! Moving to next student...");
      
      setFaceDescriptor(null);
      lastDescriptorRef.current = null;
      setDetectedFace(false);
      setSelectedStudent("");
      detectionCounterRef.current = 0;

      await fetchStudents();
      await fetchRegisteredStudents();
      
      const updatedStudentList = await axios.get("/auth/students");
      const unregisteredStudents = updatedStudentList.data.filter((student) => !student.faceRegistered);
      if (unregisteredStudents.length > 0) {
        setSelectedStudent(unregisteredStudents[0]._id);
        setMessage(`✅ Ready for next student: ${unregisteredStudents[0].name}`);
      } else {
        setMessage("✅ All students registered! Great job!");
      }
    } catch (error) {
      setMessage("❌ " + (error.response?.data?.message || "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!capturing || !modelsLoaded) return;
    const intervalId = setInterval(detectFace, 500);
    return () => {
      clearInterval(intervalId);
      if (autoRegisterRef.current) {
        clearTimeout(autoRegisterRef.current);
        autoRegisterRef.current = null;
      }
    };
  }, [capturing, modelsLoaded]);

  useEffect(() => {
    if (capturing && selectedStudent && detectionCounterRef.current >= 3 && !autoRegisterRef.current && fastMode) {
      setMessage("✅ Face locked! Auto-registering in 2 seconds...");
      autoRegisterRef.current = setTimeout(() => {
        if (lastDescriptorRef.current && selectedStudent) handleAutoRegister(lastDescriptorRef.current, selectedStudent);
        autoRegisterRef.current = null;
      }, 2000);
    }
  }, [selectedStudent, capturing, fastMode]);

  const handleRegisterFace = async () => {
    if (!selectedStudent) return setMessage("❌ Please select a student.");
    if (!faceDescriptor && !lastDescriptorRef.current) return setMessage("❌ Please capture a face image first.");

    try {
      setLoading(true);
      setMessage("⏳ Registering face...");
      const descriptorToUse = faceDescriptor || lastDescriptorRef.current;
      const response = await axios.post("/attendance/register-face", { studentId: selectedStudent, faceDescriptor: descriptorToUse });
      setMessage("✅ " + response.data.message);
      setSelectedStudent("");
      setFaceDescriptor(null);
      lastDescriptorRef.current = null;
      setDetectedFace(false);
      detectionCounterRef.current = 0;
      await fetchStudents();
      await fetchRegisteredStudents();
    } catch (error) {
      setMessage("❌ " + (error.response?.data?.message || "Failed to register face"));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFace = async (studentId) => {
    if (!confirm("Remove face registration for this student?")) return;
    try {
      setLoading(true);
      const response = await axios.post("/attendance/remove-face", { studentId });
      setMessage("✅ " + response.data.message);
      await fetchStudents();
      await fetchRegisteredStudents();
    } catch (error) {
      setMessage("❌ " + (error.response?.data?.message || "Failed to remove face"));
    } finally {
      setLoading(false);
    }
  };

  const handleStartCamera = () => {
    if (!selectedStudent && fastMode) return setMessage("⚠️ Please select a student BEFORE starting camera in Fast Mode.");
    setCapturing(true);
    setDetectedFace(false);
    setFaceDescriptor(null);
    lastDescriptorRef.current = null;
    detectionCounterRef.current = 0;
    failedDetectionsRef.current = 0;
    setMessage("");
  };

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
    <div className="font-sans grid lg:grid-cols-2 gap-6 h-full">
      
      {/* Left Panel - Registration */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8 flex flex-col gap-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Camera className="text-blue-600" /> Face Registration
          </h2>
          <p className="text-slate-500 font-medium mt-1">Capture and securely register biometric data</p>
        </div>

        {!modelsLoaded ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
            <p className="font-bold text-slate-700 text-lg">{loadingProgress}</p>
            <p className="text-sm text-slate-500 mt-2">This may take up to 60 seconds on first load...</p>
            
            {loadingTimeout && (
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200 text-left w-full max-w-md">
                <p className="text-amber-800 font-bold mb-3 flex items-center gap-2"><AlertTriangle size={18}/> Models taking longer than expected.</p>
                <div className="text-sm text-amber-900 mb-4 space-y-2">
                  <p><strong>Solutions:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Slow internet connection - try again</li>
                    <li>CDN blocked - check network</li>
                    <li>Clear browser cache</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => window.location.reload()} className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors">Reload</button>
                  <button onClick={() => { setModelsLoaded(true); setLoadingTimeout(false); setModelsActuallyLoaded(false); }} className="flex-1 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-lg border border-slate-200 transition-colors">Skip</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {!modelsActuallyLoaded && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <p className="text-amber-800 font-bold mb-2 flex items-center justify-center gap-2"><AlertTriangle size={18}/> Face Detection Not Loaded</p>
                <p className="text-sm text-amber-700 mb-3">Camera will open but face detection won't work.</p>
                <button onClick={() => window.location.reload()} className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors">Reload Models</button>
              </div>
            )}

            <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-800">
              {capturing && (
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  audio={false}
                  className="w-full h-full object-cover mirror"
                  mirrored={true}
                  onUserMediaError={() => {
                    setMessage("❌ Camera access denied.");
                    setCapturing(false);
                  }}
                />
              )}
              <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full ${capturing ? 'block' : 'hidden'}`} />
              {!capturing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <Video size={64} className="mb-4 opacity-50" />
                  <p className="font-medium">Camera is off. Click start to begin.</p>
                </div>
              )}
            </div>

            {capturing && (
              <div className={`p-3 rounded-xl text-center font-bold text-sm border flex items-center justify-center gap-2 ${detectedFace ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {detectedFace ? <><ShieldCheck size={18}/> Face detected ({faceConfidence}% confidence)</> : <><Loader2 className="animate-spin" size={18}/> Detecting face...</>}
              </div>
            )}

            {message && (
              <div className={`p-3 rounded-xl text-sm font-bold flex items-center gap-2 border ${message.includes("✅") ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : message.includes("❌") ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                {message.includes("✅") ? <CheckCircle size={18}/> : message.includes("❌") ? <AlertTriangle size={18}/> : <Info size={18}/>}
                {message}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={capturing ? handleStopCamera : handleStartCamera} 
                disabled={loading}
                className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${capturing ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'}`}
              >
                <Video size={18}/> {capturing ? "Stop Camera" : "Start Camera"}
              </button>

              {!fastMode && (
                <button
                  onClick={() => {
                    if (detectedFace && lastDescriptorRef.current) setMessage("✅ Face captured! Select student to save.");
                    else setMessage("⚠️ No face detected yet.");
                  }}
                  disabled={!capturing || !detectedFace || loading}
                  className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:shadow-none`}
                >
                  <Camera size={18}/> {lastDescriptorRef.current ? "Face Captured" : "Capture Face"}
                </button>
              )}

              {!fastMode && (
                <button
                  onClick={handleRegisterFace}
                  disabled={(!faceDescriptor && !lastDescriptorRef.current) || !selectedStudent || loading}
                  className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:shadow-none col-span-2`}
                >
                  <ShieldCheck size={18}/> {loading ? "Registering..." : "Register Face"}
                </button>
              )}

              <button
                onClick={() => setFastMode(!fastMode)}
                disabled={capturing}
                className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-white shadow-md ${fastMode ? 'bg-amber-500 hover:bg-amber-600 col-span-2' : 'bg-slate-400 hover:bg-slate-500 col-span-2'}`}
              >
                <Zap size={18}/> {fastMode ? "Fast Auto-Register ON" : "Fast Mode OFF"}
              </button>
            </div>

            <div className={`p-4 rounded-xl border ${fastMode ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
              <p className={`font-bold mb-2 flex items-center gap-2 ${fastMode ? 'text-amber-800' : 'text-blue-800'}`}>
                {fastMode ? <><Zap size={18}/> FAST MODE ENABLED</> : <><Info size={18}/> Normal Mode</>}
              </p>
              {fastMode ? (
                <div className="text-sm text-amber-900 space-y-1">
                  <p>1. Select student FIRST</p>
                  <p>2. Click Start Camera</p>
                  <p>3. Face auto-registers in 2 seconds!</p>
                </div>
              ) : (
                <div className="text-sm text-blue-900 space-y-1">
                  <p>1. Start Camera & wait for detection</p>
                  <p>2. Capture face manually</p>
                  <p>3. Select student & click Register</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select Student to Register</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700 bg-white"
              >
                <option value="">-- Choose a student --</option>
                {studentList.map((student) => (
                  <option key={student._id} value={student._id}>{student.name} ({student.email})</option>
                ))}
              </select>
              <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">
                {studentList.length} pending • {registeredStudents.length} registered
              </p>
            </div>
          </>
        )}
      </motion.div>

      {/* Right Panel - Registered */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8 flex flex-col gap-6">
        <div className="border-b border-slate-100 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="text-emerald-600" /> Registered
            </h2>
            <p className="text-slate-500 font-medium mt-1">Successfully enrolled biometric profiles</p>
          </div>
          <div className="bg-emerald-50 text-emerald-700 font-black text-2xl px-4 py-2 rounded-xl border border-emerald-100">
            {registeredStudents.length}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {registeredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <UserPlus className="text-slate-300 mb-4" size={48} />
              <p className="font-bold text-slate-600">No students registered yet</p>
              <p className="text-sm text-slate-400 mt-1">Use the panel to the left to scan faces</p>
            </div>
          ) : (
            registeredStudents.map((student, idx) => (
              <motion.div 
                key={student._id} 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-slate-200 transition-colors hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {student.name.substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 leading-tight">{student.name}</h4>
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5"><Calendar size={12}/> {student.faceRegisteredDate ? new Date(student.faceRegisteredDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveFace(student._id)} 
                  disabled={loading}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Remove Face Data"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
