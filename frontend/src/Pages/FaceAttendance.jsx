import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, CheckCircle, Video, Users, Clock, LogIn, LogOut, Loader2, AlertTriangle, Info,
  TrendingUp, Activity, UserCheck, UserX, XCircle
} from "lucide-react";

export default function FaceAttendance() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState("Initializing...");
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [message, setMessage] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0 });

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
        for (let i = 0; i < modelsPaths.length; i++) {
          const modelsPath = modelsPaths[i];
          try {
            setLoadingProgress(`Loading from CDN ${i + 1}/3...`);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("CDN Timeout")), 30000));

            await Promise.race([
              Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
                faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
                faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath),
                faceapi.nets.faceExpressionNet.loadFromUri(modelsPath),
              ]),
              timeoutPromise,
            ]);

            setLoadingProgress("✅ Models loaded!");
            clearTimeout(timeoutId);
            setModelsLoaded(true);
            loaded = true;
            break;
          } catch (error) {
            setLoadingProgress(`CDN ${i + 1} failed, trying next...`);
          }
        }

        clearTimeout(timeoutId);
        
        if (!loaded) {
          setLoadingTimeout(true);
          setLoadingProgress("❌ All CDNs failed.");
          setMessage("⚠️ Face recognition models failed to load. Limited functionality available.");
        } else {
          setMessage("✅ Face recognition system ready");
        }
      } catch (error) {
        clearTimeout(timeoutId);
        setLoadingTimeout(true);
        setLoadingProgress("❌ Failed to load models.");
        setMessage("⚠️ Error loading face recognition models.");
      }
    };

    loadModels();
    fetchTodayAttendance();

    return () => clearTimeout(timeoutId);
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get("/attendance/today");
      setTodayAttendance(response.data.attendance);
      setStats(response.data.stats);
    } catch (error) { console.error("Error fetching attendance:", error); }
  };

  const recognizeFace = async () => {
    if (!webcamRef.current || !modelsLoaded) return;

    try {
      setRecognizing(true);
      const video = webcamRef.current.video;

      const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();

      if (detections.length === 0) {
        setMessage("⚠️ No face detected. Please position your face clearly.");
        setRecognizing(false);
        return;
      }

      if (detections.length > 1) {
        setMessage("⚠️ Multiple faces detected. Please ensure only one person is visible.");
        setRecognizing(false);
        return;
      }

      const faceDescriptor = Array.from(detections[0].descriptor);

      try {
        const response = await axios.post("/attendance/recognize-face", { faceDescriptor });

        if (response.data.success) {
          const { student, action, attendance, message } = response.data;
          setLastResult({
            name: student.name,
            email: student.email,
            action: action,
            checkInTime: attendance.checkInTime,
            checkOutTime: attendance.checkOutTime,
            duration: attendance.duration,
            status: attendance.status,
            timestamp: new Date().toLocaleTimeString(),
          });
          setMessage(`✅ ${message}`);
          setTimeout(fetchTodayAttendance, 500);
        }
      } catch (error) {
        setMessage("❌ " + (error.response?.data?.message || "Face not recognized"));
        setLastResult(null);
      }
    } catch (error) {
      setMessage("❌ Error during face recognition. Please try again.");
    } finally {
      setRecognizing(false);
    }
  };

  useEffect(() => {
    if (!capturing || !modelsLoaded) return;
    const interval = setInterval(recognizeFace, 3000);
    return () => clearInterval(interval);
  }, [capturing, modelsLoaded]);

  return (
    <div className="font-sans grid lg:grid-cols-2 gap-6 h-full">
      
      {/* Left Panel - Live Recognition */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8 flex flex-col gap-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-blue-600" /> Live Attendance
          </h2>
          <p className="text-slate-500 font-medium mt-1">Real-time biometric attendance tracking</p>
        </div>

        {!modelsLoaded ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
            <p className="font-bold text-slate-700 text-lg">{loadingProgress}</p>
            <p className="text-sm text-slate-500 mt-2">This may take up to 60 seconds on first load...</p>
            
            {loadingTimeout && (
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200 text-left w-full max-w-md">
                <p className="text-amber-800 font-bold mb-3 flex items-center gap-2"><AlertTriangle size={18}/> Models taking longer than expected.</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => window.location.reload()} className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors">Reload</button>
                  <button onClick={() => { setModelsLoaded(true); setLoadingTimeout(false); }} className="flex-1 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-lg border border-slate-200 transition-colors">Skip</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-800">
              {capturing && (
                <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover mirror" mirrored={true} />
              )}
              <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full ${capturing ? 'block' : 'hidden'}`} />
              {!capturing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <Camera size={64} className="mb-4 opacity-50" />
                  <p className="font-medium">Camera is off. Click start to begin.</p>
                </div>
              )}
            </div>

            {message && (
              <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 border ${message.includes("✅") ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : message.includes("❌") ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {message.includes("✅") ? <CheckCircle size={20} className="shrink-0"/> : message.includes("❌") ? <XCircle size={20} className="shrink-0"/> : <AlertTriangle size={20} className="shrink-0"/>}
                {message}
              </div>
            )}

            <AnimatePresence>
              {lastResult && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`p-5 rounded-2xl border flex items-start gap-4 ${lastResult.action === 'check-in' ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200' : 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200'}`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0 ${lastResult.action === 'check-in' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-indigo-400 to-blue-500'}`}>
                    {lastResult.name.substring(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-bold truncate ${lastResult.action === 'check-in' ? 'text-emerald-800' : 'text-indigo-800'}`}>{lastResult.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${lastResult.action === 'check-in' ? 'bg-emerald-200 text-emerald-800' : 'bg-indigo-200 text-indigo-800'}`}>
                        {lastResult.action === 'check-in' ? <LogIn size={12}/> : <LogOut size={12}/>} {lastResult.action === 'check-in' ? 'Checked In' : 'Checked Out'}
                      </span>
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Clock size={12}/> {lastResult.timestamp}</span>
                    </div>
                    {(lastResult.duration || lastResult.checkOutTime) && (
                      <div className="mt-3 pt-3 border-t border-white/40 grid grid-cols-2 gap-2 text-xs font-medium">
                        {lastResult.checkInTime && <span className="text-slate-600">In: {new Date(lastResult.checkInTime).toLocaleTimeString()}</span>}
                        {lastResult.checkOutTime && <span className="text-slate-600">Out: {new Date(lastResult.checkOutTime).toLocaleTimeString()}</span>}
                        {lastResult.duration && <span className="col-span-2 text-slate-700 font-bold">Duration: {lastResult.duration} minutes</span>}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-3 mt-auto">
              <button 
                onClick={() => { setCapturing(!capturing); if (!capturing) setMessage("✅ Face recognition system ready"); else { setMessage(""); setLastResult(null); } }} 
                disabled={recognizing}
                className={`py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${capturing ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'}`}
              >
                <Video size={18}/> {capturing ? "Stop Recognition" : "Start Recognition"}
              </button>
              <button onClick={fetchTodayAttendance} disabled={recognizing} className="py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-slate-100 text-slate-700 hover:bg-slate-200">
                <Clock size={18}/> Refresh Data
              </button>
            </div>
          </>
        )}
      </motion.div>

      {/* Right Panel - Stats */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8 flex flex-col gap-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" /> Today's Statistics
          </h2>
          <p className="text-slate-500 font-medium mt-1">{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-1 flex items-center justify-center gap-1"><Users size={14}/> Total Enrolled</p>
            <p className="text-3xl font-black text-slate-800">{stats.total}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
            <p className="text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1 flex items-center justify-center gap-1"><UserCheck size={14}/> Present</p>
            <p className="text-3xl font-black text-emerald-700">{stats.present}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 text-center">
            <p className="text-red-600 font-bold text-xs uppercase tracking-wider mb-1 flex items-center justify-center gap-1"><UserX size={14}/> Absent</p>
            <p className="text-3xl font-black text-red-700">{stats.absent}</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
            <p className="text-blue-600 font-bold text-xs uppercase tracking-wider mb-1 flex items-center justify-center gap-1"><Activity size={14}/> Present Rate</p>
            <p className="text-3xl font-black text-blue-700">{stats.total ? Math.round((stats.present / stats.total) * 100) : 0}%</p>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col pt-2">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock size={18}/> Recent Activity</h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {todayAttendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Clock className="text-slate-300 mb-4" size={48} />
                <p className="font-bold text-slate-600">No attendance marked yet</p>
                <p className="text-sm text-slate-400 mt-1">Start recognition to begin tracking</p>
              </div>
            ) : (
              todayAttendance.map((record, idx) => (
                <motion.div key={record._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                      {record.studentId.name.substring(0,2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 truncate">{record.studentId.name}</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {record.checkInTime && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1"><LogIn size={10}/> {new Date(record.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                        {record.checkOutTime && <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1"><LogOut size={10}/> {new Date(record.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                        {!record.checkInTime && <span className="text-xs font-semibold text-slate-500">{new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                      </div>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${record.status === "Present" ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                    {record.status}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
