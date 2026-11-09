// Vercel serverless function: sends a booking notification through Brevo.
// Add the environment variables in Vercel Project Settings > Environment Variables:
// BREVO_API_KEY, BOOKING_TO_EMAIL, FROM_EMAIL, FROM_NAME

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { BREVO_API_KEY, BOOKING_TO_EMAIL, FROM_EMAIL, FROM_NAME } = process.env;
  if (!BREVO_API_KEY || !BOOKING_TO_EMAIL || !FROM_EMAIL) {
    return res.status(500).json({ error: "Email service is not configured. Please contact the site administrator." });
  }

  const { name, email, phone, notes, date, time, businessName, appointmentLabel } = req.body || {};
  if (![name, email, phone, date, time].every(v => typeof v === "string" && v.trim())) {
    return res.status(400).json({ error: "Please complete all required booking details." });
  }
  if (name.length > 100 || email.length > 150 || phone.length > 40 || (notes || "").length > 1000) {
    return res.status(400).json({ error: "One or more fields are too long." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  const safe = value => String(value || "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[c]));
  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString("en-ZA", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg"
  });
  const [hh, mm] = time.split(":").map(Number);
  const timeLabel = `${hh % 12 || 12}:${String(mm).padStart(2,"0")} ${hh >= 12 ? "PM" : "AM"}`;
  const brand = safe(businessName || "Appointment Team");
  const appointment = safe(appointmentLabel || "Appointment");
  const details = [
    ["Client name", name], ["Email address", email], ["Phone number", phone],
    ["Date", dateLabel], ["Time", `${timeLabel} (SAST)`]
  ];
  if (notes) details.push(["Additional note", notes]);

  const rows = details.map(([label, value]) => `
    <tr>
      <td style="padding:13px 15px;border-bottom:1px solid #e9edf2;color:#7b8798;font-size:13px;width:38%;">${safe(label)}</td>
      <td style="padding:13px 15px;border-bottom:1px solid #e9edf2;color:#1b2b40;font-size:13px;font-weight:600;">${safe(value)}</td>
    </tr>`).join("");

  const htmlContent = `
  <!doctype html><html><body style="margin:0;padding:30px 12px;background:#f1f3f7;font-family:Arial,Helvetica,sans-serif;color:#17263b;">
    <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e7ebf1;box-shadow:0 18px 50px rgba(20,35,55,.12);">
      <div style="padding:34px 38px;background:radial-gradient(circle at 15% 0%,#354b69 0,#172943 48%,#101a2b 100%);">
        <div style="display:inline-block;padding:9px 12px;border-radius:10px;background:linear-gradient(145deg,#f6e7bf,#c49b55);color:#1a293d;font-weight:bold;font-size:16px;box-shadow:inset 0 1px 1px #fff;">A</div>
        <div style="margin-top:25px;color:#e7c982;text-transform:uppercase;letter-spacing:2.5px;font-size:10px;font-weight:bold;">New booking request</div>
        <h1 style="margin:10px 0 7px;color:#ffffff;font-family:Georgia,serif;font-weight:normal;font-size:30px;line-height:1.2;">A new appointment<br>is on the calendar.</h1>
        <p style="margin:0;color:#c4cedb;font-size:13px;line-height:1.6;">${brand} · ${appointment}</p>
      </div>
      <div style="padding:30px 38px 36px;">
        <p style="margin:0 0 18px;color:#68768a;font-size:13px;line-height:1.6;">A visitor has submitted an appointment request. Review the details below and contact them to confirm the booking.</p>
        <div style="border:1px solid #e7ebf0;border-radius:12px;overflow:hidden;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">${rows}</table>
        </div>
        <div style="margin-top:25px;padding:15px 17px;border-radius:10px;background:#f7f4ed;border-left:3px solid #c8a15c;color:#68768a;font-size:11px;line-height:1.6;">This is an automatically generated booking notification. The appointment remains a request until you confirm it with the client.</div>
      </div>
      <div style="padding:17px 38px;background:#f8f9fb;border-top:1px solid #edf0f4;color:#98a2b0;font-size:10px;letter-spacing:.5px;">${brand} · APPOINTMENT PORTAL</div>
    </div>
  </body></html>`;

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME || businessName || "Appointment Portal", email: FROM_EMAIL },
        to: [{ email: BOOKING_TO_EMAIL }],
        replyTo: { email, name },
        subject: `New ${appointmentLabel || "appointment"} request: ${name} | ${dateLabel}`,
        htmlContent
      })
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("Brevo error:", detail);
      return res.status(502).json({ error: "The email service could not send your request. Please try again later." });
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Booking email error:", error);
    return res.status(500).json({ error: "Unable to send the booking request right now." });
  }
};
