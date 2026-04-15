import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [info, setInfo] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const justSubmitted = searchParams.get("enquiry") === "submitted";
    if (justSubmitted) {
      setInfo("Enquiry received. Admin will activate your account and share login credentials.");
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password }
      );

      // Save user
      localStorage.setItem("user", JSON.stringify(res.data.user));

      const role = res.data.user.role;

      // 🔥 Redirect based on role
      if (role === "admin") {
        navigate("/admin");
      } else if (role === "student") {
        navigate("/student");
      } else if (role === "mess") {
        navigate("/mess");
      } else if (role === "mess_staff") {
        navigate("/mess-staff");
      } else {
        navigate("/");
      }

    } catch (error) {
      const serverMsg = error.response?.data?.message;
      if (serverMsg === "Invalid email") {
        setMessage("Invalid email. If you just registered, wait for admin to activate your account.");
      } else {
        setMessage(serverMsg || "Login failed");
      }
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2>Login</h2>
        {info && (
          <div style={infoStyle}>
            {info}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <button type="submit" style={buttonStyle}>
            Login
          </button>
        </form>

        <div style={{ marginTop: "12px", textAlign: "center" }}>
          <span style={{ marginRight: "6px" }}>New student?</span>
          <button
            type="button"
            onClick={() => navigate("/register")}
            style={linkButtonStyle}
          >
            Register for hostel
          </button>
        </div>

        {message && (
          <p style={{ color: "red", marginTop: "10px" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

const containerStyle = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg, #1f4e5f, #3a7ca5)"
};

const cardStyle = {
  width: "350px",
  padding: "30px",
  background: "#fff",
  borderRadius: "10px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "15px",
  borderRadius: "5px",
  border: "1px solid #ccc"
};

const buttonStyle = {
  width: "100%",
  padding: "10px",
  backgroundColor: "#2c3e50",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer"
};

const infoStyle = {
  backgroundColor: "#e8f4ff",
  color: "#1b4f72",
  padding: "10px",
  borderRadius: "6px",
  fontSize: "14px",
  marginBottom: "12px",
  border: "1px solid #d6e9ff"
};

const linkButtonStyle = {
  background: "none",
  border: "none",
  color: "#2c3e50",
  textDecoration: "underline",
  cursor: "pointer",
  padding: 0,
  fontSize: "14px"
};

export default Login;
