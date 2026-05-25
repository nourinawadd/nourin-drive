// Edit this file to update the About Me window. No component changes needed.

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
  projects: [
    {
      title: "Tether Note — Time-Delayed Note Delivery (Live)",
      stack: "Node.js · MongoDB · Express · React",
      url: "https://tethernote.vercel.app/",
      bullets: [
        "Scheduled note delivery letting users send messages to their future selves at custom intervals.",
        "Node.js cron jobs + MongoDB automate time-based delivery and scheduling logic.",
        "JWT session management with server-side middleware validation across all note operations.",
        "Deployed to Vercel with env-var API config separating dev and production.",
      ],
    },
    {
      title: "SSH Portfolio — Terminal-Based Interactive Portfolio",
      stack: "Go · Bubble Tea · Wish · Linux · Oracle Cloud",
      url: "https://nourin.is-a.dev",
      bullets: [
        "Fully interactive TUI portfolio served over SSH using Go and the Charmbracelet stack.",
        "Deployed on Oracle Cloud (Ubuntu 22.04) with systemd, iptables, and an Nginx HTTPS landing page (Let's Encrypt).",
      ],
    },
    {
      title: "Subscriptions Tracker API",
      stack: "Node.js · Express · MongoDB",
      url: "https://github.com/nourinawadd/subscriptions-tracker-api",
      bullets: [
        "RESTful API with 15+ endpoints for subscription management.",
        "JWT auth with bcrypt hashing and role-based access control.",
        "Mongoose schema across 3 collections with referential integrity.",
      ],
    },
    {
      title: "Task Manager API",
      stack: "Node.js · Express · Sequelize · PostgreSQL · JWT · bcrypt · Swagger",
      meta: "Apr 2025",
      url: "https://github.com/nourinawadd/task-manager-api",
      bullets: [
        "RESTful Task Manager API with JWT auth, role-based access, and secure password hashing.",
        "Relational PostgreSQL schema with task filtering, sorting, and full CRUD.",
      ],
    },
    {
      title: "Line Follower Robot",
      stack: "C · Arduino · IR sensors · DC motors",
      meta: "May 2024",
      url: "https://github.com/nourinawadd/Line-Follower-Robot",
      bullets: [
        "Autonomous line-following car with IR sensors and real-time control logic in C on Arduino.",
      ],
    },
    {
      title: "Obstacle-Avoiding Car",
      stack: "C · Arduino · Ultrasonic sensor · Servo · DC motors",
      meta: "May 2024",
      url: "https://github.com/nourinawadd/obstacle-avoiding-car-arduino",
      bullets: [
        "Obstacle avoidance using an ultrasonic sensor on a servo, with real-time motor control in C on Arduino.",
      ],
    },
  ],
  games: [
    {
      title: "AstraCipher",
      stack: "Godot 4.3",
      meta: "Nov 2024",
      url: "https://sifrstudios.itch.io/astracipher",
      bullets: [
        "2D story-driven top-down platformer for dark-web awareness.",
        "Scene instancing + event-driven architecture, AI-driven NPCs, state machines, and pathfinding.",
      ],
    },
    {
      title: "Suhoor Rush",
      stack: "Unity · C# · WebGL",
      meta: "Mar 2025",
      url: "https://sifrstudios.itch.io/suhoor-rush",
      bullets: [
        "2D web game blending rapid item collection with narrative; built in 3 days for a 'Collect Them All' jam.",
        "UI Toolkit menus, Scriptable Objects, C# events/delegates, object pooling, sprite atlasing, WebGL tweaks.",
      ],
    },
    {
      title: "Puppetry",
      stack: "Godot 4.3",
      meta: "Jan 2025",
      url: "https://sifrstudios.itch.io/puppetry",
      bullets: [
        "2D puzzle for a power-themed jam, built in 9 days.",
        "Environmental interaction, multi-puppet coordination, and timed disintegration mechanics.",
      ],
    },
  ],
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
