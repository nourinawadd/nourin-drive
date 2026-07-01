// Edit this file to update the top of the About Me window — profile, links,
// bio, and skills. No component changes needed.
//
// Exception: every list section below (education, experience, projects, games,
// extracurriculars, certifications, languages) is generated from content files
// via `npm run add` — see the CV_* imports. Edit those by adding/editing
// content/projects/*.md (projects/games) or content/cv/*.md (everything else),
// not by hand here.

import {
  CV_PROJECTS,
  CV_GAMES,
  CV_EXPERIENCE,
  CV_EDUCATION,
  CV_EXTRACURRICULARS,
  CV_CERTIFICATIONS,
  CV_LANGUAGES,
} from "./cv.generated";

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
  education: CV_EDUCATION,
  experience: CV_EXPERIENCE,
  projects: CV_PROJECTS,
  games: CV_GAMES,
  extracurriculars: CV_EXTRACURRICULARS,
  certifications: CV_CERTIFICATIONS,
  languages: CV_LANGUAGES,
};
