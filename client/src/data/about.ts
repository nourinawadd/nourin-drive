// Edit this file to update the About Me window. No component changes needed.
//
// Exception: the "Software Projects" and "Game Projects" sections come from
// content/projects/*.md (add them with `npm run add`) — see CV_PROJECTS /
// CV_GAMES below. Everything else here is hand-edited.

import { CV_PROJECTS, CV_GAMES } from "./cv.generated";

export type AboutLink = { label: string; url: string };
export type Entry = {
  title: string;
  subtitle?: string;
  meta?: string;       // location · dates
  stack?: string;
  url?: string;
  bullets?: string[];
};

export type About = {
  name: string;
  title: string;
  location: string;
  email: string;
  phone: string;
  links: AboutLink[];
  bio: string[];
  skills: { label: string; items: string[] }[];
  education: Entry[];
  experience: Entry[];
  projects: Entry[];
  games: Entry[];
  extracurriculars: Entry[];
  certifications: string[];
  languages: string[];
};

export const ABOUT: About = {
  name: "Nourin Awad",
  title: "Full Stack Software Engineer",
  location: "Cairo, Egypt",
  email: "nourinawad@gmail.com",
  phone: "+201550580490",
  links: [
    { label: "Github",    url: "https://github.com/nourinawadd" },
    { label: "LinkedIn",  url: "https://linkedin.com/in/nourinawad" },
    { label: "Instagram", url: "https://instagram.com/diarydump.jpg" },
    { label: "Sifr Studios", url: "https://sifrstudios.itch.io/" },
  ],
  bio: [
    "Full stack engineer studying Communications and Computer Engineering at Mansoura University. I build web apps end to end — Node/Express/Mongo and .NET/SQL Server alike — and also work across embedded systems, game development, and graphic design.",
    "Founded Sifr Studios, a Mansoura-based game studio making narrative-driven games that blend storytelling with unique gameplay mechanics.",
  ],
  skills: [
    { label: "Languages", items: ["C", "C#", "Python", "JavaScript", "TypeScript", "SQL", "GDScript"] },
    { label: "Frameworks & Libraries", items: [".NET", "ASP.NET MVC", "React", "Angular", "Express.js", "Node.js", "Mongoose", "Sequelize"] },
    { label: "Databases", items: ["SQL Server", "MongoDB", "PostgreSQL", "Database Design", "Query Optimization"] },
    { label: "Backend & Architecture", items: ["RESTful API Design", "JWT Auth", "Middleware", "MVC", "Modular Architecture", "CI/CD"] },
    { label: "Cloud & DevOps", items: ["Vercel", "Git", "GitHub Workflows", "Docker", "AWS concepts", "Linux", "Oracle Cloud", "systemd", "Postman"] },
    { label: "Embedded Systems", items: ["Arduino", "Embedded C", "Ultrasonic/IR sensors", "Motor control (PWM, servos, DC)", "Circuit design", "PID control"] },
    { label: "Game Development", items: ["Godot (GDScript, C#)", "Unity", "Gameplay systems", "AI behavior", "Physics", "Level & narrative design", "Object pooling"] },
    { label: "Graphic Design", items: ["Illustration", "Branding", "Typography", "Color theory", "Photo manipulation", "Adobe Suite", "Figma"] },
  ],
  education: [
    {
      title: "Mansoura University",
      subtitle: "B.Eng. — Communications and Computer Engineering",
      meta: "Mansoura, Egypt · Sep 2022 – Present",
      bullets: [
        "GPA: 3.95 / 4.0",
        "Coursework: Data Structures, Operating Systems, Distributed Systems, Artificial Intelligence, Calculus",
      ],
    },
    {
      title: "Mansoura College International Schools",
      subtitle: "IGCSE — 99%",
      meta: "Mansoura, Egypt · Sep 2020 – Sep 2022",
    },
  ],
  experience: [
    {
      title: "National Telecommunications Institute (NTI)",
      subtitle: "MEAN Stack Intern",
      meta: "Mansoura, Egypt · Jun – Jul 2025",
      bullets: [
        "Built RESTful APIs with JWT auth and MongoDB CRUD via Mongoose.",
        "Developed Angular SPAs with routing, reactive forms, observables, and state management.",
        "Applied UI/UX practices, API security, testing, and performance optimization.",
      ],
    },
    {
      title: "Information Technology Institute (ITI)",
      subtitle: ".NET Full Stack Intern",
      meta: "Mansoura, Egypt · Jul – Aug 2025",
      bullets: [
        "Designed relational schemas in SQL Server with optimized stored procedures and multi-table joins.",
        "Built OOP and ASP.NET MVC apps in C# with Razor views, controllers, and routing.",
        "Implemented Entity Framework (LINQ, migrations, CRUD) for database integration.",
      ],
    },
    {
      title: "Nile University",
      subtitle: "Blockchain Alternatives Research Intern",
      meta: "Cairo, Egypt · Aug – Sep 2025",
      bullets: [
        "Researched blockchain scalability and alternatives: Lightning Network, sharding, DAGs, sidechains, layer-two protocols.",
      ],
    },
  ],
  projects: CV_PROJECTS,
  games: CV_GAMES,
  extracurriculars: [
    {
      title: "IEEE Mansoura Student Branch — Victoris 3.0",
      subtitle: "Technical Director",
      meta: "Jun – Sep 2024",
      bullets: [
        "Led technical planning and execution for a national event with 880+ participants and 200+ teams across 4 tracks (IoT, CTF, Software, Micromouse).",
        "Managed online/offline phases, coordinated with teams and mentors, ensured smooth technical operations.",
      ],
    },
    {
      title: "IEEE Mansoura Computer Society Chapter",
      subtitle: "Backend Committee Member",
      meta: "Dec 2024 – Present",
      bullets: [
        "Built backend components of a MERN-stack application: RESTful APIs, database management, and server-side logic.",
      ],
    },
    {
      title: "CATReloaded",
      subtitle: "Game Developer",
      meta: "Dec 2024 – Present",
      bullets: [
        "Applied Unity fundamentals (2D/3D, mechanics, physics, UI) and game design principles.",
        "Collaborated in 48-hour game jams, designing assets and building prototypes in Unity/Godot.",
      ],
    },
  ],
  certifications: [
    "Backend Development and APIs — freeCodeCamp",
    "Relational Database — freeCodeCamp",
    "Foundational C# with Microsoft — freeCodeCamp",
    "Project Management Foundations — LinkedIn",
    "Time Management Fundamentals — LinkedIn",
    "Python Programming — MaharaTech",
  ],
  languages: [
    "English — Full Professional Proficiency",
    "Arabic — Native",
  ],
};
