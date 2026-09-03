import { ConvexClient } from "convex/browser";

const url = process.env.VITE_CONVEX_URL ?? "http://127.0.0.1:3210";
const client = new ConvexClient(url);

const samples = [
  {
    company: "Nimbus Labs",
    role: "Senior Software Engineer",
    location: "Remote (US)",
    salary: "$190k–$230k",
    postedUrl: "https://nimbus.example/jobs/sse",
    source: "LinkedIn",
    requirements: ["8+ yrs in TypeScript/Node", "Distributed systems design", "AWS at scale", "Mentoring junior engineers"],
    checklist: [
      "Tailor your resume to lead with the distributed-systems project you shipped at scale",
      "Draft a cover letter that names how you'd own Nimbus's real-time pipeline",
      "Reach out to the hiring manager on LinkedIn with one concrete idea",
      "Prepare a 5-minute walkthrough of your last production incident",
    ],
    column: "applied",
    status: "Application sent",
  },
  {
    company: "Fern & Field",
    role: "Product Designer",
    location: "Hybrid · NYC",
    salary: "$140k",
    postedUrl: "https://fern.example/careers/pd",
    source: "Greenhouse",
    requirements: ["Systems thinking", "Figma mastery", "Design systems experience"],
    checklist: [
      "Update your portfolio with the two most recent shipped products",
      "Draft a cover letter about how you'd improve their onboarding flow",
      "Book a portfolio review with a friend before the call",
    ],
    column: "interview",
    status: "Interview scheduled · 2nd round",
  },
  {
    company: "Halcyon Data",
    role: "Staff Platform Engineer",
    location: "San Francisco",
    salary: "$250k + equity",
    postedUrl: "https://halcyon.example/roles/staff",
    source: "Lever",
    requirements: ["Kubernetes", "Go", "Observability", "SRE mindset"],
    checklist: [
      "Update resume to emphasize on-call ownership and reliability wins",
      "Write a short note on your incident postmortem process",
    ],
    column: "offer",
    status: "Offer received · negotiating comp",
  },
  {
    company: "Brightpath",
    role: "Frontend Engineer",
    location: "Remote",
    salary: "",
    postedUrl: "https://brightpath.example/apply/fe",
    source: "Handshake",
    requirements: ["React", "TypeScript", "Accessibility"],
    checklist: [
      "Polish the case study on your React migration",
    ],
    column: "rejected",
    status: "Not selected",
  },
];

const jobIds = [];
for (const s of samples) {
  const s2 = { ...s, location: s.location || undefined, salary: s.salary || undefined };
  const id = await client.mutation("jobs:create", s2);
  jobIds.push(id);
  console.log("created", s.company, "-", s.role, id);
}

console.log("Seeded", jobIds.length, "jobs");
await client.close();
