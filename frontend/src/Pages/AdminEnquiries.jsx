import { useEffect, useState } from "react";
import axios from "axios";

function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState([]);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    const res = await axios.get("http://localhost:5000/api/enquiries");
    setEnquiries(res.data);
  };

  const updateEnquiry = async (id, status, notes) => {
    await axios.put(`http://localhost:5000/api/enquiries/${id}`, {
      status,
      notes
    });
    fetchEnquiries();
  };

 const convertToStudent = async (id) => {
  try {
    const res = await axios.post(
      `http://localhost:5000/api/enquiries/convert/${id}`
    );

    alert(
      `Student Created!\nEmail: ${res.data.loginCredentials.email}\nPassword: ${res.data.loginCredentials.password}`
    );

    fetchEnquiries();
  } catch (error) {
    console.log(error.response?.data);
    alert("Conversion failed: " + (error.response?.data?.message || "Unknown error"));
  }
};

const deleteEnquiry = async (id) => {
  if (window.confirm("Are you sure you want to delete this enquiry?")) {
    try {
      await axios.delete(`http://localhost:5000/api/enquiries/${id}`);
      alert("Enquiry deleted successfully");
      fetchEnquiries();
    } catch (error) {
      alert("Failed to delete enquiry: " + (error.response?.data?.message || "Unknown error"));
    }
  }
};



  const getStatusColor = (status) => {
    switch (status) {
      case "New":
        return "#3498db";
      case "Contacted":
        return "#f39c12";
      case "Interested":
        return "#9b59b6";
      case "Final":
        return "#27ae60";
      case "Joined":
        return "#2ecc71";
      default:
        return "#ccc";
    }
  };

  return (
    <div style={{ padding: "40px", background: "#f4f6f9", minHeight: "100vh" }}>
      <h2 style={{ marginBottom: "20px" }}>Enquiry Management</h2>

      <div style={{
        background: "white",
        borderRadius: "10px",
        boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
        padding: "20px"
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#ecf0f1" }}>
              <th>Name</th>
              <th>Course</th>
              <th>Room</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {enquiries.map((enq) => (
              <tr key={enq._id} style={{ textAlign: "center", borderBottom: "1px solid #ddd" }}>
                <td>{enq.name}</td>
                <td>{enq.course}</td>
                <td>{enq.preferredRoomType}</td>

                <td>
                  <span style={{
                    padding: "5px 10px",
                    borderRadius: "20px",
                    backgroundColor: getStatusColor(enq.status),
                    color: "white",
                    fontSize: "12px"
                  }}>
                    {enq.status}
                  </span>
                </td>

                <td>
                  <textarea
                    defaultValue={enq.notes}
                    onBlur={(e) =>
                      updateEnquiry(enq._id, enq.status, e.target.value)
                    }
                    style={{
                      width: "150px",
                      height: "40px",
                      borderRadius: "5px",
                      border: "1px solid #ccc"
                    }}
                  />
                </td>

                <td>
                  <select
                    value={enq.status}
                    onChange={(e) =>
                      updateEnquiry(enq._id, e.target.value, enq.notes)
                    }
                    style={{ padding: "5px", borderRadius: "5px" }}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Interested">Interested</option>
                    <option value="Final">Final</option>
                    <option value="Joined">Joined</option>
                  </select>

                  {enq.status === "Final" && (
                    <button
                      onClick={() => convertToStudent(enq._id)}
                      style={{
                        marginLeft: "10px",
                        background: "#27ae60",
                        color: "white",
                        border: "none",
                        padding: "5px 10px",
                        borderRadius: "5px",
                        cursor: "pointer"
                      }}
                    >
                      Convert
                    </button>
                  )}

                  <button
                    onClick={() => deleteEnquiry(enq._id)}
                    style={{
                      marginLeft: "10px",
                      background: "#e74c3c",
                      color: "white",
                      border: "none",
                      padding: "5px 10px",
                      borderRadius: "5px",
                      cursor: "pointer"
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminEnquiries;
