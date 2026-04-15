import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Enquiry() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    course: "",
    preferredRoomType: ""
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.phone ||
      !formData.email ||
      !formData.course ||
      !formData.preferredRoomType
    ) {
      setMessage("Please fill all fields");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5000/api/enquiries",
        formData
      );

      const created = res.status === 201 || res.data?._id;

      if (created) {
        setMessage("✅ Enquiry submitted successfully! Redirecting to login...");
        setFormData({
          name: "",
          phone: "",
          email: "",
          course: "",
          preferredRoomType: ""
        });

        // Send user to login after a short pause
        setTimeout(() => navigate("/login?enquiry=submitted"), 1200);
      } else {
        setMessage("❌ Could not submit enquiry. Please try again.");
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "❌ Error submitting enquiry");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f6f9",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <div
        style={{
          width: "400px",
          background: "#ffffff",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)"
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
          Hostel Enquiry Form
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            style={inputStyle}
          />

          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            style={inputStyle}
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            style={inputStyle}
          />

          <input
            type="text"
            name="course"
            placeholder="Course"
            value={formData.course}
            onChange={handleChange}
            style={inputStyle}
          />

          <select
            name="preferredRoomType"
            value={formData.preferredRoomType}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="">Select Room Type</option>
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Triple">Triple</option>
          </select>

          <button type="submit" style={buttonStyle}>
            Submit Enquiry
          </button>
        </form>

        {message && (
          <p style={{ marginTop: "15px", textAlign: "center" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

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

export default Enquiry;
