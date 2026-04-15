import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import axios from "axios";

function FaceAttendance() {
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
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    total: 0,
  });

  // Load face-api models with timeout
  useEffect(() => {
    let timeoutId = null;
    
    const loadModels = async () => {
      try {
        // Set timeout - if models don't load in 45 seconds, show error
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
          try {
            setLoadingProgress(`Loading from CDN ${i + 1}/3...`);
            console.log("Loading models from:", modelsPath);
            
            // Load with timeout - 30 seconds max per CDN
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("CDN Timeout")), 30000)
            );

            await Promise.race([
              Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
                faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
                faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath),
                faceapi.nets.faceExpressionNet.loadFromUri(modelsPath),
              ]),
              timeoutPromise,
            ]);

            console.log("✅ Models loaded successfully from:", modelsPath);
            setLoadingProgress("✅ Models loaded!");
            clearTimeout(timeoutId);
            setModelsLoaded(true);
            loaded = true;
            break;
          } catch (error) {
            console.warn(`❌ Failed from CDN ${i + 1}:`, error.message);
            setLoadingProgress(`CDN ${i + 1} failed, trying next...`);
            lastError = error;
          }
        }

        clearTimeout(timeoutId);
        
        if (!loaded) {
          setLoadingTimeout(true);
          setLoadingProgress("❌ All CDNs failed. Check your internet connection.");
          console.error("Failed to load from all CDNs:", lastError);
          setMessage("⚠️ Face recognition models failed to load. Limited functionality available.");
        } else {
          setMessage("✅ Face recognition system ready");
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("Model loading error:", error);
        setLoadingTimeout(true);
        setLoadingProgress("❌ Failed to load models.");
        setMessage("⚠️ Error loading face recognition models.");
      }
    };

    loadModels();
    fetchTodayAttendance();

    return () => clearTimeout(timeoutId);
  }, []);

  // Fetch today's attendance
  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/attendance/today");
      setTodayAttendance(response.data.attendance);
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  };

  // Recognize face and mark attendance
  const recognizeFace = async () => {
    if (!webcamRef.current || !modelsLoaded) return;

    try {
      setRecognizing(true);
      const video = webcamRef.current.video;

      // Detect face
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

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

      // Get face descriptor
      const faceDescriptor = Array.from(detections[0].descriptor);

      // Send to backend for recognition
      try {
        const response = await axios.post(
          "http://localhost:5000/api/attendance/recognize-face",
          { faceDescriptor }
        );

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
          
          // Refresh attendance
          setTimeout(() => {
            fetchTodayAttendance();
          }, 500);
        }
      } catch (error) {
        setMessage("❌ " + (error.response?.data?.message || "Face not recognized"));
        setLastResult(null);
      }
    } catch (error) {
      console.error("Error recognizing face:", error);
      setMessage("❌ Error during face recognition. Please try again.");
    } finally {
      setRecognizing(false);
    }
  };

  // Auto-recognize every 3 seconds when capturing
  useEffect(() => {
    if (!capturing || !modelsLoaded) return;

    const interval = setInterval(() => {
      recognizeFace();
    }, 3000);

    return () => clearInterval(interval);
  }, [capturing, modelsLoaded]);

  return (
    <div style={styles.container}>
      {/* Left Panel - Live Recognition */}
      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>🔍 Face Recognition Attendance</h2>
          <p style={styles.panelSubtitle}>Real-time biometric attendance tracking</p>
        </div>

        {!modelsLoaded ? (
          <div style={{ ...styles.loadingBox, minHeight: "300px" }}>
            <div style={styles.spinner}></div>
            <p style={{ marginTop: "20px", fontSize: "16px", fontWeight: "500" }}>
              {loadingProgress}
            </p>
            <p style={{ marginTop: "10px", fontSize: "14px", color: "#666", textAlign: "center" }}>
              This may take up to 60 seconds on first load...
            </p>
            {loadingTimeout && (
              <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#fff3cd", borderRadius: "8px" }}>
                <p style={{ color: "#856404", marginBottom: "10px" }}>
                  ⚠️ Models are taking longer than expected.
                </p>
                <p style={{ fontSize: "13px", color: "#856404", marginBottom: "15px" }}>
                  Possible causes:<br/>
                  • Slow internet connection<br/>
                  • CDN is blocked in your region<br/>
                  • Browser cache issues
                </p>
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
            )}
          </div>
        ) : (
          <>
            {/* Webcam Section */}
            <div style={styles.webcamContainer}>
              {capturing && (
                <Webcam
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  style={styles.webcam}
                />
              )}
              <canvas
                ref={canvasRef}
                style={{
                  ...styles.canvas,
                  display: capturing ? "block" : "none",
                }}
              />
              {!capturing && (
                <div style={styles.noWebcam}>
                  <div style={styles.noWebcamIcon}>🎯</div>
                  <p>Click "Start Recognition" to begin</p>
                </div>
              )}
            </div>

            {/* Message Box */}
            <div
              style={{
                ...styles.messageBox,
                ...(message.includes("✅") ? styles.messageSuccess : {}),
                ...(message.includes("❌") ? styles.messageError : {}),
                ...(message.includes("⚠️") ? styles.messageWarning : {}),
              }}
            >
              {message}
            </div>

            {/* Last Result */}
            {lastResult && (
              <div style={styles.resultBox}>
                <div style={styles.resultIcon}>👤</div>
                <div style={styles.resultContent}>
                  <p style={styles.resultName}>{lastResult.name}</p>
                  <p style={styles.resultTime}>
                    ⏰ {lastResult.timestamp}
                  </p>
                  <p style={styles.resultAction}>
                    {lastResult.action === 'check-in' ? '🟢 Check-In' : '🔴 Check-Out'}
                  </p>
                  {lastResult.checkInTime && (
                    <p style={styles.resultTime}>
                      Check-In: {new Date(lastResult.checkInTime).toLocaleTimeString()}
                    </p>
                  )}
                  {lastResult.checkOutTime && (
                    <p style={styles.resultTime}>
                      Check-Out: {new Date(lastResult.checkOutTime).toLocaleTimeString()}
                    </p>
                  )}
                  {lastResult.duration && (
                    <p style={styles.resultDuration}>
                      Duration: {lastResult.duration} minutes
                    </p>
                  )}
                  <p style={styles.resultStatus}>
                    Status: {lastResult.status}
                  </p>
                </div>
              </div>
            )}

            {/* Controls */}
            <div style={styles.controls}>
              <button
                style={{
                  ...styles.btn,
                  ...(capturing ? styles.btnDanger : styles.btnPrimary),
                }}
                onClick={() => {
                  setCapturing(!capturing);
                  if (!capturing) {
                    setMessage("✅ Face recognition system ready");
                  } else {
                    setMessage("");
                    setLastResult(null);
                  }
                }}
                disabled={recognizing}
              >
                {capturing ? "⏹️ Stop Recognition" : "▶️ Start Recognition"}
              </button>

              <button
                style={{
                  ...styles.btn,
                  ...styles.btnInfo,
                }}
                onClick={fetchTodayAttendance}
                disabled={recognizing}
              >
                🔄 Refresh
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right Panel - Attendance Stats */}
      <div style={styles.panel}>
        <div style={styles.panelHeader}>
          <h2 style={styles.panelTitle}>📊 Today's Attendance</h2>
          <p style={styles.panelSubtitle}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>👥</div>
            <div>
              <p style={styles.statLabel}>Total Students</p>
              <p style={styles.statNumber}>{stats.total}</p>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div>
              <p style={styles.statLabel}>Present</p>
              <p style={{ ...styles.statNumber, color: "#27ae60" }}>
                {stats.present}
              </p>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={styles.statIcon}>❌</div>
            <div>
              <p style={styles.statLabel}>Absent</p>
              <p style={{ ...styles.statNumber, color: "#e74c3c" }}>
                {stats.absent}
              </p>
            </div>
          </div>

          {stats.total > 0 && (
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📈</div>
              <div>
                <p style={styles.statLabel}>Present %</p>
                <p style={{ ...styles.statNumber, color: "#3498db" }}>
                  {stats.total ? Math.round((stats.present / stats.total) * 100) : 0}%
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Attendance List */}
        <div style={styles.attendanceList}>
          <h3 style={styles.listTitle}>Marked Attendance</h3>
          {todayAttendance.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📝</div>
              <p>No attendance marked yet</p>
            </div>
          ) : (
            <div style={styles.attendance}>
              {todayAttendance.map((record) => (
                <div key={record._id} style={styles.attendanceRecord}>
                  <div style={styles.recordLeft}>
                    <div style={styles.recordAvatar}>
                      {record.studentId.name.split(" ")[0][0]}
                      {record.studentId.name.split(" ")[1]?.[0]}
                    </div>
                    <div>
                      <p style={styles.recordName}>
                        {record.studentId.name}
                      </p>
                      <div style={styles.recordTimes}>
                        {record.checkInTime && (
                          <p style={styles.recordTime}>
                            🟢 In: {new Date(record.checkInTime).toLocaleTimeString()}
                          </p>
                        )}
                        {record.checkOutTime && (
                          <p style={styles.recordTime}>
                            🔴 Out: {new Date(record.checkOutTime).toLocaleTimeString()}
                          </p>
                        )}
                        {record.duration && (
                          <p style={styles.recordDuration}>
                            ⏱️ {record.duration} min
                          </p>
                        )}
                        {!record.checkInTime && (
                          <p style={styles.recordTime}>
                            {new Date(record.timestamp).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      ...styles.statusBadge,
                      ...(record.status === "Present"
                        ? styles.badgePresent
                        : styles.badgeAbsent),
                    }}
                  >
                    {record.status === "Present" ? "✅" : "❌"} {record.status}
                  </div>
                </div>
              ))}
            </div>
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

  messageWarning: {
    background: "rgba(241, 196, 15, 0.1)",
    color: "#f39c12",
    border: "1px solid rgba(241, 196, 15, 0.3)",
  },

  resultBox: {
    background: "linear-gradient(135deg, rgba(39, 174, 96, 0.1), rgba(46, 204, 113, 0.1))",
    padding: "15px",
    borderRadius: "12px",
    border: "1px solid rgba(39, 174, 96, 0.3)",
    display: "flex",
    gap: "15px",
    alignItems: "center",
  },

  resultIcon: {
    fontSize: "32px",
  },

  resultContent: {
    flex: 1,
  },

  resultName: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#27ae60",
    margin: "0 0 5px 0",
  },

  resultTime: {
    fontSize: "13px",
    color: "#7f8c8d",
    margin: "0 0 3px 0",
  },

  resultAction: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#27ae60",
    margin: "0 0 5px 0",
  },

  resultStatus: {
    fontSize: "12px",
    color: "#95a5a6",
    margin: "0 0 3px 0",
  },

  resultDuration: {
    fontSize: "12px",
    color: "#f39c12",
    margin: "0 0 3px 0",
    fontWeight: "500",
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

  btnInfo: {
    background: "linear-gradient(135deg, #3498db, #2980b9)",
    color: "white",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "15px",
  },

  statCard: {
    background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))",
    padding: "15px",
    borderRadius: "12px",
    border: "1px solid rgba(102, 126, 234, 0.2)",
    display: "flex",
    align: "center",
    gap: "12px",
  },

  statIcon: {
    fontSize: "28px",
  },

  statLabel: {
    fontSize: "12px",
    color: "#7f8c8d",
    margin: "0 0 3px 0",
  },

  statNumber: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#667eea",
    margin: 0,
  },

  attendanceList: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  listTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#2c3e50",
    margin: "0 0 10px 0",
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    textAlign: "center",
    color: "#7f8c8d",
  },

  emptyIcon: {
    fontSize: "40px",
    marginBottom: "10px",
  },

  attendance: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "400px",
    overflowY: "auto",
  },

  attendanceRecord: {
    background: "linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05))",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid rgba(102, 126, 234, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  recordLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
  },

  recordAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #667eea, #764ba2)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "12px",
  },

  recordName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#2c3e50",
    margin: "0 0 2px 0",
  },

  recordTime: {
    fontSize: "11px",
    color: "#7f8c8d",
    margin: 0,
  },

  recordTimes: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  recordDuration: {
    fontSize: "10px",
    color: "#f39c12",
    margin: 0,
    fontWeight: "500",
  },

  statusBadge: {
    padding: "5px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
  },

  badgePresent: {
    background: "rgba(39, 174, 96, 0.2)",
    color: "#27ae60",
  },

  badgeAbsent: {
    background: "rgba(231, 76, 60, 0.2)",
    color: "#e74c3c",
  },
};

export default FaceAttendance;
