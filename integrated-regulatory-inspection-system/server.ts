import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client Lazily to prevent crash if key is missing on start
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// DB SETUP & SEED DATA (Communications Authority of Kenya)
// ----------------------------------------------------
const DB_PATH = path.join(process.cwd(), "db.json");

const defaultUsers = [
  {
    id: "usr-001",
    email: "admin@ca.go.ke",
    password: "admin123",
    name: "Director Gen. F. Mutua",
    role: "Admin",
    avatar: "FM",
    department: "Executive Office"
  },
  {
    id: "usr-002",
    email: "inspector@ca.go.ke",
    password: "inspector123",
    name: "Inspector J. Kariuki",
    role: "Inspector",
    avatar: "JK",
    department: "Compliance & Enforcement Div."
  },
  {
    id: "usr-003",
    email: "operator@ca.go.ke",
    password: "operator123",
    name: "P. Mwangi",
    role: "Operator",
    avatar: "PM",
    department: "Capital FM Lead Engineer"
  }
];

const defaultLicensees = [
  {
    id: "lic-001",
    name: "Safaricom PLC",
    sector: "Telecommunications",
    licenseNumber: "TL/NSP/001-SF",
    region: "Nairobi County",
    status: "Active",
    lastInspection: "2026-04-12",
    riskScore: 12,
    contactEmail: "compliance@safaricom.co.ke",
    contactPhone: "+254 722 000000",
    documents: [
      { name: "Unified Network Service Provider License", type: "License", expiry: "2030-12-31" },
      { name: "Spectrum Allocation Certificate (900MHz/1800MHz)", type: "Certificate", expiry: "2027-06-30" },
      { name: "Equipment Type-Approval (5G Base Station)", type: "Type Approval", expiry: "Permanent" },
    ],
  },
  {
    id: "lic-002",
    name: "Airtel Kenya Networks Ltd",
    sector: "Telecommunications",
    licenseNumber: "TL/NSP/002-AT",
    region: "Nairobi County",
    status: "Active",
    lastInspection: "2026-01-15",
    riskScore: 28,
    contactEmail: "legal-compliance@ke.airtel.com",
    contactPhone: "+254 733 100100",
    documents: [
      { name: "Unified Network Service Provider License", type: "License", expiry: "2029-08-15" },
      { name: "Spectrum Allocation Certificate (1800MHz)", type: "Certificate", expiry: "2026-12-31" },
    ],
  },
  {
    id: "lic-003",
    name: "Postal Corporation of Kenya (Posta)",
    sector: "Postal/Courier",
    licenseNumber: "PST/PL/012-PCK",
    region: "National Coverage",
    status: "Warning",
    lastInspection: "2026-05-20",
    riskScore: 68,
    contactEmail: "info@posta.co.ke",
    contactPhone: "+254 20 3242000",
    documents: [
      { name: "Public Postal License", type: "License", expiry: "2028-03-10" },
      { name: "Postal Warehouse Safety Certificate", type: "Safety Certificate", expiry: "2026-06-30" },
    ],
  },
  {
    id: "lic-004",
    name: "Royal Media Services (Citizen TV)",
    sector: "Broadcasting",
    licenseNumber: "BC/FTA/045-RMS",
    region: "Rift Valley Region",
    status: "Active",
    lastInspection: "2026-03-10",
    riskScore: 18,
    contactEmail: "regulatory@royalmedia.co.ke",
    contactPhone: "+254 20 2721415",
    documents: [
      { name: "Commercial Free-to-Air Television Broadcasting License", type: "License", expiry: "2032-05-18" },
      { name: "Frequency Transmit Permit (Nairobi RF-101.3)", type: "Permit", expiry: "2027-01-01" },
    ],
  },
  {
    id: "lic-005",
    name: "Jamii Telecommunications Ltd (JTL Faiba)",
    sector: "Telecommunications",
    licenseNumber: "TL/NSP/008-JTL",
    region: "Mombasa County",
    status: "Active",
    lastInspection: "2026-02-28",
    riskScore: 22,
    contactEmail: "regulatory@jtl.co.ke",
    contactPhone: "+254 711 054100",
    documents: [
      { name: "Unified Network Service Provider License", type: "License", expiry: "2031-10-22" },
      { name: "Infrastructure Provider License", type: "License", expiry: "2031-10-22" },
    ],
  },
  {
    id: "lic-006",
    name: "G4S Secure Logistics Kenya",
    sector: "Postal/Courier",
    licenseNumber: "PST/CR/089-G4S",
    region: "Western Region",
    status: "Active",
    lastInspection: "2026-06-02",
    riskScore: 25,
    contactEmail: "logistics.compliance@ke.g4s.com",
    contactPhone: "+254 20 6982000",
    documents: [
      { name: "International Courier License", type: "License", expiry: "2027-09-30" },
      { name: "Warehouse Safety Audit", type: "Audit Certificate", expiry: "2027-01-15" },
    ],
  },
  {
    id: "lic-007",
    name: "Capital FM (Capital Group)",
    sector: "Broadcasting",
    licenseNumber: "BC/FM/023-CAP",
    region: "Nairobi County",
    status: "Warning",
    lastInspection: "2026-06-18",
    riskScore: 55,
    contactEmail: "info@capitalfm.co.ke",
    contactPhone: "+254 20 2210098",
    documents: [
      { name: "Commercial FM Radio Broadcasting License", type: "License", expiry: "2028-11-20" },
      { name: "Frequency Transmit Permit (98.4 MHz)", type: "Permit", expiry: "2026-05-30" },
    ],
  },
];

const defaultInspectionRecords = [
  {
    id: "ins-101",
    licenseeId: "lic-001",
    licenseeName: "Safaricom PLC",
    sector: "Telecommunications",
    date: "2026-04-12",
    officerName: "Eng. Benard Kiprop",
    location: "Westlands Base Station, Nairobi",
    coordinates: { lat: -1.2642, lng: 36.8043 },
    checklist: [
      { id: "tel-1", label: "License Status", category: "Administrative", description: "Verify operator holds active network license and permits.", response: "Pass", notes: "All active." },
      { id: "tel-2", label: "Spectrum Bounds", category: "Technical", description: "Measure RF emissions conform strictly to allocated bandwidth limits.", response: "Pass", notes: "Operating nicely inside 1800MHz allocation." },
      { id: "tel-3", label: "QoS Standards (Call Setup)", category: "Technical", description: "Call Setup Success Rate (CSSR) must exceed 98.5%.", response: "Pass", notes: "Current test registers 99.1%." },
      { id: "tel-4", label: "Data Protection Controls", category: "Cybersecurity", description: "User logs, subscriber data storage must conform to Kenya Data Protection Act 2019.", response: "Pass", notes: "AES-256 enabled, local database audited." },
    ],
    signature: "Safaricom Compliance Officer - Jared Okeyo",
    status: "Compliant",
    evidencePhotos: [],
    notes: "Site visit confirmed fully compliant Base Station parameters.",
  },
  {
    id: "ins-102",
    licenseeId: "lic-003",
    licenseeName: "Postal Corporation of Kenya (Posta)",
    sector: "Postal/Courier",
    date: "2026-05-20",
    officerName: "Officer Lydia Kwamboka",
    location: "GPO Nairobi Hub",
    coordinates: { lat: -1.2844, lng: 36.8228 },
    checklist: [
      { id: "pst-1", label: "Delivery Timelines Compliance", category: "Operational", description: "Verify intra-city delivery complies with the 24-hour delivery timeline standards.", response: "Fail", notes: "Sampling showed 32% of items took over 48 hours to process." },
      { id: "pst-2", label: "Track & Trace Integrity", category: "Operational", description: "Trace random tracking numbers to confirm precise electronic logs are maintained.", response: "Pass", notes: "System shows updates, but physical sorting lags." },
      { id: "pst-3", label: "Prohibited Items Protocol", category: "Security", description: "Verify active screening and physical registers for contraband or dangerous goods.", response: "Fail", notes: "Screening machine broken down since April 15th. Contraband logs incomplete." },
      { id: "pst-4", label: "Warehouse Safety Standards", category: "Security", description: "Verify adequate fire suppression, storage height limits, and security locks.", response: "Pass", notes: "Fire extinguishers are inspected and valid." },
    ],
    signature: "Posta Duty Supervisor - Moses Ruto",
    status: "Correction Order",
    evidencePhotos: [],
    notes: "Identified serious screening equipment failures and package delay backlogs. Formally issued 14-day correction order.",
  },
  {
    id: "ins-103",
    licenseeId: "lic-007",
    licenseeName: "Capital FM (Capital Group)",
    sector: "Broadcasting",
    date: "2026-06-18",
    officerName: "Eng. Grace Muthoni",
    location: "Limuru Transmitter Tower Site",
    coordinates: { lat: -1.1112, lng: 36.6433 },
    checklist: [
      { id: "brd-1", label: "License & Permits", category: "Administrative", description: "Verify active broadcast license and valid frequency permit.", response: "Fail", notes: "Frequency Transmit Permit for 98.4 MHz expired on 2026-05-30. No renewal submitted." },
      { id: "brd-2", label: "Signal Deviation Bounds", category: "Technical", description: "Measure frequency deviation is strictly within +/- 75 kHz.", response: "Pass", notes: "Measured deviation is 42 kHz." },
      { id: "brd-3", label: "Spurious RF Harmonics", category: "Technical", description: "Ensure zero harmonic interference in adjacent frequencies.", response: "Fail", notes: "Second harmonic observed at 196.8 MHz causing mild feedback near regional airports." },
      { id: "brd-4", label: "Emergency Alert Capability", category: "Technical", description: "Verify immediate system override capability for emergency national alerts.", response: "Pass", notes: "Override controls active." },
    ],
    signature: "Capital Transmitter Engineer - Peter Mwangi",
    status: "Correction Order",
    evidencePhotos: [],
    notes: "Expired transmit permit coupled with secondary harmonic feedback detected at transmitter site. Demanded immediate calibration and renewal filing.",
  },
];

const defaultSpectrumAlerts = [
  { id: "spec-001", frequency: 104.5, location: "Nairobi CBD", level: -42, status: "Unidentified", timestamp: "2026-07-20T21:30:00Z" },
  { id: "spec-002", frequency: 185.2, location: "Kisumu Port Area", level: -48, status: "Investigating", timestamp: "2026-07-20T22:15:00Z" },
  { id: "spec-003", frequency: 98.4, location: "Limuru / Airport Path", level: -35, status: "Authorized", timestamp: "2026-07-20T22:35:00Z" },
  { id: "spec-004", frequency: 433.9, location: "Mombasa Industrial Area", level: -31, status: "Unidentified", timestamp: "2026-07-20T22:45:00Z" },
];

const defaultOperatorComplaints = [
  { id: "comp-01", licenseeName: "Safaricom PLC", source: "Twitter", text: "@SafaricomPLC fiber has been dropping every 20 minutes in Kilimani since morning. Customer support is completely unresponsive! #SafaricomDown", sentiment: "negative", sector: "Telecommunications", date: "2026-07-20" },
  { id: "comp-02", licenseeName: "Airtel Kenya Networks Ltd", source: "Consumer Forum", text: "Airtel 4G signal in Syokimau is non-existent. Calls drop immediately. I am getting 0.2 Mbps throughput. This is robbery.", sentiment: "negative", sector: "Telecommunications", date: "2026-07-20" },
  { id: "comp-03", licenseeName: "Postal Corporation of Kenya (Posta)", source: "Direct Hotline", text: "Sent a package from Nairobi to Eldoret. It has been 5 days and track & trace still says 'Received at GPO'. No updates.", sentiment: "negative", sector: "Postal/Courier", date: "2026-07-19" },
  { id: "comp-04", licenseeName: "Royal Media Services (Citizen TV)", source: "Facebook", text: "The signal on Citizen TV in Kakamega has been flickering constantly. Sound cuts out during news.", sentiment: "neutral", sector: "Broadcasting", date: "2026-07-18" },
];

const defaultQosMetrics = [
  { licenseeId: "lic-001", licenseeName: "Safaricom PLC", timestamp: "18:00", cdr: 0.42, cssr: 99.2, throughput: 48.5, latency: 18 },
  { licenseeId: "lic-001", licenseeName: "Safaricom PLC", timestamp: "19:00", cdr: 0.51, cssr: 98.9, throughput: 44.2, latency: 22 },
  { licenseeId: "lic-001", licenseeName: "Safaricom PLC", timestamp: "20:00", cdr: 0.72, cssr: 98.4, throughput: 39.1, latency: 29 },
  { licenseeId: "lic-001", licenseeName: "Safaricom PLC", timestamp: "21:00", cdr: 0.65, cssr: 98.7, throughput: 42.0, latency: 25 },
  { licenseeId: "lic-001", licenseeName: "Safaricom PLC", timestamp: "22:00", cdr: 0.38, cssr: 99.3, throughput: 51.2, latency: 19 },
  { licenseeId: "lic-002", licenseeName: "Airtel Kenya Networks Ltd", timestamp: "18:00", cdr: 1.15, cssr: 97.4, throughput: 28.1, latency: 35 },
  { licenseeId: "lic-002", licenseeName: "Airtel Kenya Networks Ltd", timestamp: "19:00", cdr: 1.42, cssr: 96.8, throughput: 22.4, latency: 42 },
  { licenseeId: "lic-002", licenseeName: "Airtel Kenya Networks Ltd", timestamp: "20:00", cdr: 1.89, cssr: 95.5, throughput: 18.2, latency: 51 },
  { licenseeId: "lic-002", licenseeName: "Airtel Kenya Networks Ltd", timestamp: "21:00", cdr: 1.55, cssr: 96.1, throughput: 20.9, latency: 45 },
  { licenseeId: "lic-002", licenseeName: "Airtel Kenya Networks Ltd", timestamp: "22:00", cdr: 1.08, cssr: 97.9, throughput: 31.4, latency: 32 },
];

const defaultFines = [
  { id: 'fn-401', operator: 'Postal Corporation of Kenya (Posta)', violation: 'Timeline Breach & Screening Failure', amount: 'KES 250,000', status: 'Unpaid', issuedDate: '2026-05-22' },
  { id: 'fn-402', operator: 'Capital FM (Capital Group)', violation: 'Transmitting without active Frequency Permit', amount: 'KES 150,000', status: 'Pending Tribunal Appeal', issuedDate: '2026-06-20' },
];

// In-Memory state initially, will be populated by loadDatabase()
let dbData: any = {
  users: [],
  licensees: [],
  inspectionRecords: [],
  spectrumAlerts: [],
  operatorComplaints: [],
  qosMetrics: [],
  fines: []
};

function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), "utf-8");
    console.log("Database successfully saved to", DB_PATH);
  } catch (error) {
    console.error("Failed to write db.json file database:", error);
  }
}

function loadDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const content = fs.readFileSync(DB_PATH, "utf-8");
      dbData = JSON.parse(content);
      console.log("Database successfully loaded from", DB_PATH);
    } else {
      console.log("Creating new persistent db.json from pre-seeded state...");
      dbData = {
        users: defaultUsers,
        licensees: defaultLicensees,
        inspectionRecords: defaultInspectionRecords,
        spectrumAlerts: defaultSpectrumAlerts,
        operatorComplaints: defaultOperatorComplaints,
        qosMetrics: defaultQosMetrics,
        fines: defaultFines
      };
      saveDatabase();
    }
  } catch (error) {
    console.error("Failed to read db.json file database:", error);
    dbData = {
      users: defaultUsers,
      licensees: defaultLicensees,
      inspectionRecords: defaultInspectionRecords,
      spectrumAlerts: defaultSpectrumAlerts,
      operatorComplaints: defaultOperatorComplaints,
      qosMetrics: defaultQosMetrics,
      fines: defaultFines
    };
  }
}

// Initial DB load
loadDatabase();

// ----------------------------------------------------
// REST API ENDPOINTS
// ----------------------------------------------------

// 1. Get entire compliance dataset + fines + users list
app.get("/api/compliance-data", (req, res) => {
  res.json({
    licensees: dbData.licensees,
    inspectionRecords: dbData.inspectionRecords,
    spectrumAlerts: dbData.spectrumAlerts,
    operatorComplaints: dbData.operatorComplaints,
    qosMetrics: dbData.qosMetrics,
    fines: dbData.fines || [],
    users: dbData.users.map((u: any) => {
      const { password, ...safe } = u;
      return safe;
    })
  });
});

// 2. Auth Endpoint: Login
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const user = dbData.users.find(
      (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (user) {
      const { password: _, ...safeUser } = user;
      return res.json({ success: true, user: safeUser });
    } else {
      return res.status(401).json({ success: false, error: "Invalid credentials. Please verify your email and password." });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Submit new inspection record (Inspector or Admin)
app.post("/api/submit-inspection", (req, res) => {
  try {
    const record = req.body;
    if (!record.licenseeId || !record.sector) {
      return res.status(400).json({ error: "Missing required inspection fields." });
    }

    const newRecord = {
      id: `ins-${Date.now().toString().slice(-3)}`,
      licenseeId: record.licenseeId,
      licenseeName: record.licenseeName || "Unknown Licensee",
      sector: record.sector,
      date: new Date().toISOString().split("T")[0],
      officerName: record.officerName || "Field Inspector",
      location: record.location || "Nairobi Field",
      coordinates: record.coordinates || { lat: -1.2921, lng: 36.8219 },
      checklist: record.checklist || [],
      signature: record.signature || "",
      status: record.status || "Pending Review",
      evidencePhotos: record.evidencePhotos || [],
      notes: record.notes || "",
    };

    dbData.inspectionRecords.unshift(newRecord);

    // Update licensee's last inspection date & risk score dynamically based on failed count
    const licensee = dbData.licensees.find((l: any) => l.id === record.licenseeId);
    if (licensee) {
      licensee.lastInspection = newRecord.date;
      const failedCount = newRecord.checklist.filter((item: any) => item.response === "Fail").length;
      if (failedCount > 0) {
        licensee.status = "Warning";
        licensee.riskScore = Math.min(100, licensee.riskScore + (failedCount * 15));
      } else {
        licensee.status = "Active";
        licensee.riskScore = Math.max(10, licensee.riskScore - 10);
      }
    }

    saveDatabase();
    res.status(201).json({ success: true, record: newRecord });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// ADMIN ONLY OPERATIONS (Role Based Access Control)
// ----------------------------------------------------

// Middleware/Helper to verify if a request headers specify an Admin role 
// To keep things lightweight, the client sends 'X-User-Role' header
function checkAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const role = req.headers["x-user-role"];
  if (role !== "Admin") {
    return res.status(403).json({ error: "Access Denied. Only Admin users hold rights to write or delete this resource." });
  }
  next();
}

// 4. Create operator licensee (Admin only)
app.post("/api/admin/licensees", checkAdmin, (req, res) => {
  try {
    const data = req.body;
    if (!data.name || !data.sector || !data.licenseNumber) {
      return res.status(400).json({ error: "Missing required operator fields." });
    }

    const newLicensee = {
      id: `lic-${Date.now().toString().slice(-3)}`,
      name: data.name,
      sector: data.sector,
      licenseNumber: data.licenseNumber,
      region: data.region || "National Coverage",
      status: data.status || "Active",
      lastInspection: "None yet",
      riskScore: data.riskScore || 20,
      contactEmail: data.contactEmail || "info@operator.co.ke",
      contactPhone: data.contactPhone || "+254 200 000000",
      documents: data.documents || []
    };

    dbData.licensees.push(newLicensee);
    saveDatabase();
    res.status(201).json({ success: true, licensee: newLicensee });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Update operator licensee details (Admin only)
app.put("/api/admin/licensees/:id", checkAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const licensee = dbData.licensees.find((l: any) => l.id === id);

    if (!licensee) {
      return res.status(404).json({ error: "Licensee not found" });
    }

    Object.assign(licensee, updateData);
    saveDatabase();
    res.json({ success: true, licensee });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Delete operator licensee (Admin only)
app.delete("/api/admin/licensees/:id", checkAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const index = dbData.licensees.findIndex((l: any) => l.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Licensee not found" });
    }

    dbData.licensees.splice(index, 1);
    saveDatabase();
    res.json({ success: true, message: "Licensee removed from CA system." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Delete/Archive inspection record (Admin only)
app.delete("/api/admin/inspections/:id", checkAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const index = dbData.inspectionRecords.findIndex((r: any) => r.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Inspection record not found" });
    }

    dbData.inspectionRecords.splice(index, 1);
    saveDatabase();
    res.json({ success: true, message: "Inspection record archived from live logs." });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Issue a penalty fine (Admin only)
app.post("/api/admin/issue-fine", checkAdmin, (req, res) => {
  try {
    const { operator, violation, amount } = req.body;
    if (!operator || !violation || !amount) {
      return res.status(400).json({ error: "Missing penalty metrics." });
    }

    const newFine = {
      id: `fn-${Date.now().toString().slice(-3)}`,
      operator,
      violation,
      amount,
      status: "Unpaid",
      issuedDate: new Date().toISOString().split("T")[0]
    };

    if (!dbData.fines) dbData.fines = [];
    dbData.fines.unshift(newFine);
    saveDatabase();

    res.status(201).json({ success: true, fine: newFine });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Update fine status (Admin only)
app.put("/api/admin/fines/:id", checkAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const fine = dbData.fines.find((f: any) => f.id === id);

    if (!fine) {
      return res.status(404).json({ error: "Penalty fine record not found." });
    }

    fine.status = status;
    saveDatabase();
    res.json({ success: true, fine });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// AI SERVICES COGNITION
// ----------------------------------------------------

// 10. AI Endpoint: Risk-based Scheduling analysis
app.post("/api/ai/schedule-risk", async (req, res) => {
  try {
    const ai = getGeminiClient();
    const prompt = `
      You are the AI Risk-based scheduling engine for the Communications Authority of Kenya (CA).
      Analyze the current licensees, their status, last inspection dates, and risk scores. Recommend which 3 licensees are of the HIGHEST RISK and require immediate, prioritized inspection scheduling. Offer a brief analytical justification for each.

      Data:
      ${JSON.stringify(dbData.licensees.map((l: any) => ({ name: l.name, sector: l.sector, lastInspection: l.lastInspection, riskScore: l.riskScore, status: l.status })))}

      Please return a highly professional JSON object conforming to this exact structure:
      {
        "recommendations": [
          {
            "licenseeName": "Name",
            "sector": "Sector",
            "riskScore": 75,
            "justification": "Clear, concise regulatory reasoning referencing KICA guidelines."
          },
          ...
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("AI Schedule Risk Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 11. AI Endpoint: Generate Notice of Non-Compliance
app.post("/api/ai/generate-nnc", async (req, res) => {
  try {
    const { record } = req.body;
    if (!record) {
      return res.status(400).json({ error: "Missing inspection record for NNC generation." });
    }

    const ai = getGeminiClient();
    const prompt = `
      You are the Legal and Enforcement Counsel at the Communications Authority of Kenya (CA).
      Generate a highly formal, professional, and authoritative "Notice of Non-Compliance (NNC)" warning letter.
      Use official terminology. Reference the Kenya Information and Communications Act (KICA) and/or the Data Protection Act 2019 where appropriate.
      
      Details:
      - Operator: ${record.licenseeName}
      - Sector: ${record.sector}
      - Date of Inspection: ${record.date}
      - Lead Inspector: ${record.officerName}
      - Location of Violation: ${record.location}
      - Violations Identified (Failed Items):
        ${JSON.stringify(record.checklist.filter((item: any) => item.response === "Fail").map((i: any) => ({ label: i.label, description: i.description, note: i.notes })))}
      
      The document must include:
      1. Formal letterhead & Reference Number (e.g. CA/ENF/NNC/...)
      2. Comprehensive breakdown of the violations.
      3. Statutory requirements breached under Kenyan law (KICA / Data Protection Act).
      4. Ordered corrective actions to be completed within a strict 14-day deadline.
      5. Explicit warnings of legal penalties, fines, or license suspension if ignored.
      6. Formal signature block for the Director General, Communications Authority of Kenya.

      Return the document as markdown, clean and beautiful. Do not include extraneous chatter.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ document: response.text || "Failed to generate document." });
  } catch (error: any) {
    console.error("AI Generate NNC Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 12. AI Endpoint: Compliance Copilot Chat
app.post("/api/ai/compliance-consult", async (req, res) => {
  try {
    const { message, history } = req.body;
    const ai = getGeminiClient();

    const formattedHistory = history ? history.map((h: any) => ({
      role: h.role,
      parts: [{ text: h.text }]
    })) : [];

    const systemInstruction = `
      You are IRIS AI Copilot, a senior regulatory legal expert specialized in Kenyan telecom and broadcasting law.
      Your mandate is to advise Communications Authority of Kenya (CA) officers and operators on compliance guidelines, including:
      - Kenya Information and Communications Act (KICA)
      - Kenya Data Protection Act 2019
      - Spectrum allocation regulations
      - Quality of Service (QoS) parameters (e.g., call drop rate limits < 1%, data throughput standards)
      - Postal and Courier service licensing rules
      - Cybersecurity incident reporting rules under National KE-CIRT/CC.

      Provide extremely precise, professional, objective, and legally sound answers. Include specific clause citations where applicable.
      Keep the formatting clean, elegant, and structured with bullet points.
    `;

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction,
      },
      history: formattedHistory,
    });

    const response = await chat.sendMessage({ message });
    res.json({ text: response.text || "No response." });
  } catch (error: any) {
    console.error("AI Compliance Consult Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Setup Vite Dev server / static production files middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
