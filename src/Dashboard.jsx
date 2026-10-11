import { useEffect, useState } from "react";
import api from "./api";
import {
  HeartPulse, LayoutDashboard, CalendarDays, Users,
  Stethoscope, LogOut, CheckCircle, XCircle, RefreshCw
} from "lucide-react";
import "./Dashboard.css";

export default function Dashboard({ user, onLogout }) {
  const role = (user?.role || "PATIENT").toUpperCase();
  const isAdmin = role === "ADMIN";
  const isDoctor = role === "DOCTOR";

  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeView, setActiveView] = useState("Dashboard");
  const [booking, setBooking] = useState({
    doctorId: "",
    patientPhone: "",
    date: "",
    time: ""
  });
  const [notice, setNotice] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const doctorResponse = await api.get("/doctors");
      setDoctors(doctorResponse.data || []);

      let appointmentResponse;
      if (isAdmin) {
        appointmentResponse = await api.get("/appointments");
      } else if (isDoctor) {
        appointmentResponse = user?.doctorId
          ? await api.get(`/appointments/doctor/${user.doctorId}`)
          : { data: [] };
      } else {
        appointmentResponse = await api.get(
          `/appointments/patient/${encodeURIComponent(user.email)}`
        );
      }

      setAppointments(appointmentResponse.data || []);
    } catch (err) {
      setError(
        "Could not load information. Check that the backend is running and the API is available."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [user?.email, user?.doctorId, role]);

  async function bookAppointment(e) {
    e.preventDefault();
    setNotice("");
    setError("");

    const selectedDoctor = doctors.find(
      (d) => String(d.id) === String(booking.doctorId)
    );

    if (!selectedDoctor) {
      setError("Please select a doctor.");
      return;
    }

    try {
      await api.post("/appointments", {
        patientName: user.name,
        patientEmail: user.email,
        patientPhone: booking.patientPhone,
        doctorId: Number(booking.doctorId),
        doctorName: selectedDoctor.name,
        specialization: selectedDoctor.specialization,
        date: booking.date,
        time: booking.time
      });

      setNotice("Appointment booked successfully!");
      setBooking({
        doctorId: "",
        patientPhone: "",
        date: "",
        time: ""
      });
      setActiveView("Appointments");
      await loadDashboard();
    } catch (err) {
      setError(
        typeof err.response?.data === "string"
          ? err.response.data
          : "Booking failed. Please check the selected doctor and try again."
      );
    }
  }

  async function updateStatus(id, status) {
    setError("");
    try {
      await api.put(`/appointments/${id}/status`, { status });
      setNotice(`Appointment ${status.toLowerCase()}.`);
      await loadDashboard();
    } catch {
      setError("Could not update the appointment.");
    }
  }

  const pending = appointments.filter(
    (a) => a.status === "PENDING"
  ).length;

  const selectedDoctor = doctors.find(
    (d) => String(d.id) === String(booking.doctorId)
  );

  const navItems = isAdmin
    ? ["Dashboard", "Doctors", "Appointments"]
    : isDoctor
      ? ["Dashboard", "Appointments"]
      : ["Dashboard", "Find Doctors", "Book Appointment", "Appointments"];

  return (
    <div className="mc-dashboard">
      <aside className="mc-sidebar">
        <div className="mc-brand">
          <span className="mc-brand-icon"><HeartPulse size={25} /></span>
          <span>MediCare<small>HOSPITAL PORTAL</small></span>
        </div>

        <div className="mc-menu-title">WORKSPACE</div>
        {navItems.map((item) => (
          <button
            key={item}
            className={`mc-menu-item ${activeView === item ? "active" : ""}`}
            onClick={() => {
              setActiveView(item);
              setNotice("");
              setError("");
            }}
          >
            {item === "Dashboard" ? <LayoutDashboard size={19} /> :
             item === "Doctors" || item === "Find Doctors" ? <Stethoscope size={19} /> :
             item === "Book Appointment" ? <CalendarDays size={19} /> :
             <Users size={19} />}
            {item}
          </button>
        ))}

        <div className="mc-sidebar-bottom">
          <div className="mc-user">
            <div className="mc-avatar">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="mc-user-info">
              <strong>{user?.name || "User"}</strong>
              <span>{role}</span>
            </div>
          </div>
          <button className="mc-logout" onClick={onLogout}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="mc-main">
        <header className="mc-topbar">
          <div>
            <div className="mc-breadcrumb">MediCare / {activeView}</div>
            <h1>
              {activeView === "Dashboard"
                ? `${isAdmin ? "Admin" : isDoctor ? "Doctor" : "Patient"} Dashboard`
                : activeView}
            </h1>
            <p>Welcome back, {user?.name || "User"}.</p>
          </div>
          <button className="mc-refresh" onClick={loadDashboard}>
            <RefreshCw size={17} /> Refresh
          </button>
        </header>

        {error && <div className="mc-error">{error}</div>}
        {notice && <div className="mc-notice">{notice}</div>}

        {activeView === "Dashboard" && (
          <>
            <section className="mc-welcome">
              <div>
                <span className="mc-eyebrow">MEDICARE HEALTHCARE</span>
                <h2>{isAdmin ? "Hospital overview" : isDoctor ? "Your patient schedule" : "Your healthcare, made simpler."}</h2>
                <p>
                  {isAdmin
                    ? "Manage doctors and monitor hospital appointments."
                    : isDoctor
                      ? "Review your assigned appointments."
                      : "Find doctors and manage your appointments in one place."}
                </p>
              </div>
              <HeartPulse size={78} strokeWidth={1.3} />
            </section>

            <section className="mc-stats">
              <div className="mc-stat-card">
                <div className="mc-stat-icon teal"><Stethoscope size={22} /></div>
                <span>Total Doctors</span>
                <strong>{doctors.length}</strong>
                <small>Doctors in the directory</small>
              </div>
              <div className="mc-stat-card">
                <div className="mc-stat-icon blue"><CalendarDays size={22} /></div>
                <span>Total Appointments</span>
                <strong>{appointments.length}</strong>
                <small>Appointments visible to you</small>
              </div>
              <div className="mc-stat-card">
                <div className="mc-stat-icon orange"><Users size={22} /></div>
                <span>Pending Requests</span>
                <strong>{pending}</strong>
                <small>Awaiting a decision</small>
              </div>
            </section>

            {isAdmin && (
              <section className="mc-panel">
                <div className="mc-panel-heading">
                  <div>
                    <h2>Doctors Directory</h2>
                    <p>Doctors registered in the hospital database</p>
                  </div>
                  <button className="mc-refresh" onClick={() => setActiveView("Doctors")}>
                    View all
                  </button>
                </div>
                <DoctorList doctors={doctors} />
              </section>
            )}

            <section className="mc-panel">
              <div className="mc-panel-heading">
                <div>
                  <h2>Recent Appointments</h2>
                  <p>Latest appointment records</p>
                </div>
                <button className="mc-refresh" onClick={() => setActiveView("Appointments")}>
                  View all
                </button>
              </div>
              <AppointmentList
                appointments={appointments.slice(0, 5)}
                isAdmin={isAdmin}
                loading={loading}
                updateStatus={updateStatus}
              />
            </section>
          </>
        )}

        {(activeView === "Doctors" || activeView === "Find Doctors") && (
          <section className="mc-panel">
            <div className="mc-panel-heading">
              <div>
                <h2>{isAdmin ? "Hospital Doctors" : "Find a Doctor"}</h2>
                <p>Specializations and appointment information</p>
              </div>
              <span className="mc-count">{doctors.length} doctors</span>
            </div>
            <DoctorList
              doctors={doctors}
              onBook={(doctor) => {
                setBooking({ ...booking, doctorId: String(doctor.id) });
                setActiveView("Book Appointment");
              }}
              showBook={!isAdmin && !isDoctor}
            />
          </section>
        )}

        {activeView === "Book Appointment" && !isAdmin && !isDoctor && (
          <section className="mc-panel mc-booking-panel">
            <div className="mc-panel-heading">
              <div>
                <h2>Book an Appointment</h2>
                <p>Select your doctor, preferred date and time.</p>
              </div>
            </div>

            <form className="mc-booking-form" onSubmit={bookAppointment}>
              <label>
                Choose Doctor
                <select
                  value={booking.doctorId}
                  onChange={(e) => setBooking({ ...booking, doctorId: e.target.value, time: "" })}
                  required
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.specialization}
                    </option>
                  ))}
                </select>
              </label>

              {selectedDoctor && (
                <div className="mc-doctor-detail">
                  <strong>{selectedDoctor.name}</strong>
                  <span>{selectedDoctor.qualification || selectedDoctor.specialization}</span>
                  <span>Available days: {selectedDoctor.availableDays || "Contact hospital"}</span>
                  <span>Timings: {selectedDoctor.timing || "Contact hospital"}</span>
                  <span>Consultation fee: ₹{selectedDoctor.fee ?? "Contact hospital"}</span>
                </div>
              )}

              <label>
                Phone Number
                <input
                  type="tel"
                  value={booking.patientPhone}
                  onChange={(e) => setBooking({ ...booking, patientPhone: e.target.value })}
                  placeholder="Enter your contact number"
                  required
                />
              </label>

              <label>
                Appointment Date
                <input
                  type="date"
                  value={booking.date}
                  min={new Date().toLocaleDateString("en-CA")}
                  onChange={(e) => setBooking({ ...booking, date: e.target.value })}
                  required
                />
              </label>

              <label>
                Preferred Time
                <select
                  value={booking.time}
                  onChange={(e) => setBooking({ ...booking, time: e.target.value })}
                  required
                >
                  <option value="">Select a time</option>
                  {[
                    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
                    "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
                    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
                    "04:00 PM", "04:30 PM", "05:00 PM"
                  ].map((time) => <option key={time}>{time}</option>)}
                </select>
              </label>

              <button className="mc-book-submit" type="submit">
                <CalendarDays size={18} /> Confirm Appointment
              </button>
            </form>
          </section>
        )}

        {activeView === "Appointments" && (
          <section className="mc-panel">
            <div className="mc-panel-heading">
              <div>
                <h2>{isAdmin ? "All Appointments" : isDoctor ? "Assigned Appointments" : "My Appointments"}</h2>
                <p>Appointment information from the database</p>
              </div>
              <span className="mc-count">{appointments.length} records</span>
            </div>
            <AppointmentList
              appointments={appointments}
              isAdmin={isAdmin}
              loading={loading}
              updateStatus={updateStatus}
            />
          </section>
        )}

        <footer className="mc-footer">
          © {new Date().getFullYear()} MediCare Hospital · Healthcare Management Portal
        </footer>
      </main>
    </div>
  );
}

function DoctorList({ doctors, onBook, showBook = false }) {
  if (!doctors.length) {
    return <div className="mc-empty">No doctors found. Check the backend /doctors API.</div>;
  }

  return (
    <div className="mc-doctor-grid">
      {doctors.map((d) => (
        <article className="mc-doctor-card" key={d.id}>
          <div className="mc-doctor-icon"><Stethoscope size={27} /></div>
          <h3>{d.name}</h3>
          <span className="mc-specialty">{d.specialization}</span>
          <p>{d.qualification || "Qualified Medical Professional"}</p>
          <p>{d.experience ?? 0} years experience</p>
          <p><strong>Days:</strong> {d.availableDays || "Contact hospital"}</p>
          <p><strong>Timings:</strong> {d.timing || "Contact hospital"}</p>
          <p><strong>Fee:</strong> ₹{d.fee ?? "N/A"}</p>
          {showBook && (
            <button className="mc-book-submit" onClick={() => onBook(d)}>
              Book Appointment
            </button>
          )}
        </article>
      ))}
    </div>
  );
}

function AppointmentList({ appointments, isAdmin, loading, updateStatus }) {
  if (loading) return <div className="mc-empty">Loading appointments...</div>;

  if (!appointments.length) {
    return <div className="mc-empty">No appointments found yet.</div>;
  }

  return (
    <div className="mc-table-wrap">
      <table className="mc-table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Date & Time</th>
            <th>Status</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => (
            <tr key={a.id}>
              <td><strong>{a.patientName}</strong><small>{a.patientEmail}</small></td>
              <td><strong>{a.doctorName || "Doctor"}</strong><small>{a.specialization || "General"}</small></td>
              <td><strong>{a.date}</strong><small>{a.time}</small></td>
              <td><span className={`mc-status ${(a.status || "PENDING").toLowerCase()}`}>{a.status || "PENDING"}</span></td>
              {isAdmin && (
                <td>
                  {a.status === "PENDING" ? (
                    <div className="mc-actions">
                      <button className="mc-accept" title="Accept" onClick={() => updateStatus(a.id, "ACCEPTED")}><CheckCircle size={17} /></button>
                      <button className="mc-reject" title="Reject" onClick={() => updateStatus(a.id, "REJECTED")}><XCircle size={17} /></button>
                    </div>
                  ) : "Reviewed"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}