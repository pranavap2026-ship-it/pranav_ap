/* ════════════════════════════════════════════════════════════
   Everything you see on the site lives here. Edit freely.
   Colours & fonts: top of src/styles/global.css
   Photos: public/img (faces = round avatars, photos = polaroids & photo stack,
   stickers = cut-out frames with a white sticker border)
   ════════════════════════════════════════════════════════════ */

export const profile = {
  name: 'Pranav',
  full: 'Pranav A P',
  role: 'Freelance web developer',
  location: 'Kottayam, Kerala, India',
  email: 'appranav611@gmail.com',
  intro: 'I build full-stack web apps and client websites with React, Node.js and Python, with a growing love for AI-driven automation.',
  github: 'https://github.com/pranavap2026-ship-it',
  linkedin: 'https://www.linkedin.com/in/pranav-a-p-b52b15290?utm_source=share_via&utm_content=profile&utm_medium=member_android', // Add your LinkedIn profile URL when ready
  site: 'https://pranavap.vercel.app/',
  resume: '', // optional: 'resume.pdf' in /public, WITHOUT your phone number
  avatar: 'img/faces/smile.jpg',
}

// quick stats under your intro
export const heroCounts = [
  { value: '9', label: 'featured projects' },
  { value: '1', label: 'live client website' },
  { value: '3', label: 'languages spoken' },
]

export const about = {
  // a fanned stack of photos: click it to shuffle through your roles
  photos: ['img/photos/pranav-profile.jpg', 'img/photos/pranav-profile.jpg', 'img/photos/pranav-profile.jpg', 'img/photos/pranav-profile.jpg'],
  // one role per photo, shown under it (click the stack to cycle)
  roles: ['Freelance Web Developer', 'AI App Builder', 'Full-Stack Developer', 'CSE Student'],
  paragraphs: [
    "Hi! I'm Pranav, a freelance web developer and B.Tech Computer Science and Engineering student at College of Engineering, Poonjar, in Kottayam, Kerala.",
    'I enjoy building full-stack apps and client websites: React interfaces, Node and Express backends, MongoDB and MySQL databases, and AI features powered by LLM APIs. Right now I am learning Python automation, data analysis and dashboards.',
  ],
  stats: [
    { value: '2023', label: 'B.Tech CSE · started' },
    { value: '9', label: 'Featured projects' },
    { value: '1', label: 'Live client website' },
    { value: '3', label: 'Languages · EN, HI, ML' },
  ],
}

/* visual: 'review' | 'market' | 'site' (illustrated art), or add image: 'img/...'. link is optional. */
export const projects = [
  {
    title: 'Campus Twin',
    tag: 'Final-year project · Smart campus',
    visual: 'market',
    text: 'A campus digital twin platform bringing campus services into one role-based application, including maps, timetables, notices, events, complaints, directory and service dashboards.',
    tech: ['React', 'Vite', 'Node.js', 'Express', 'MongoDB', 'Leaflet', 'JWT'],
    link: '',
    color: '#eee8e6',
    details: 'Designed a modular, role-oriented campus platform for students, faculty and administrators. Key modules include campus navigation, timetable management, complaints, emergency information and dedicated dashboards.',
    architecture: ['React + Vite', 'Express REST API', 'MongoDB', 'Role-based access']
  },

  {
    title: 'Revynix AI',
    tag: 'AI · Code review platform',
    visual: 'review',
    text: 'A full-stack AI-powered code review platform that uses LLM APIs to identify potential bugs, security vulnerabilities and optimization opportunities.',
    tech: ['React', 'Node.js', 'Express', 'MongoDB', 'JWT', 'OpenRouter AI'],
    link: '',
    color: '#FFE5D9',
    details: 'Includes authenticated user flows, code submission, AI-generated review feedback and an administrative dashboard. Explores practical LLM integration in developer tooling.',
    architecture: ['React frontend', 'Node.js + Express', 'MongoDB + JWT', 'OpenRouter LLM API']
  },

  {
    title: 'LabShare',
    tag: 'Real-time · Code sharing',
    visual: 'review',
    text: 'A responsive browser-based code-sharing platform designed for college computer labs, allowing users to share code between computers and mobile devices.',
    tech: ['Next.js', 'React', 'TypeScript', 'Real-time state', 'Vercel'],
    link: 'https://labshare-nine.vercel.app/',
    color: '#F8E2D9',
    details: 'Created to make sharing code between lab computers simple through a browser-based workflow without requiring desktop application installation.',
    architecture: ['Next.js application', 'Shared application state', 'Responsive browser UI', 'Vercel deployment']
  },

  {
    title: 'Draksha Ayurveda',
    tag: 'Freelance · First client project',
    visual: 'site',
    text: 'A professional website developed for Draksha Ayurveda and Wellness Centre to establish a modern, welcoming and informative online presence.',
    tech: ['Web Design', 'Responsive UI', 'Frontend Development', 'Client Delivery'],
    link: 'https://drakshaayurveda.in',
    color: '#FFEDE5',
    details: 'A real-world freelance engagement involving client requirement analysis, website design, clinic information presentation and responsive frontend development.',
    architecture: ['Client requirements', 'Responsive frontend', 'Content presentation', 'Live website']
  },

  

 

  {
    title: 'SkyWing CEP',
    tag: 'College · Media team platform',
    visual: 'site',
    text: 'A digital platform associated with the SkyWing Media Team at College of Engineering Poonjar, showcasing media activities, creative work and team information.',
    tech: ['React', 'JavaScript', 'HTML', 'CSS', 'Responsive Design'],
    link: '',
    color: '#F4E8FF',
    details: 'Developed to establish a digital presence for the college media team, highlighting creative activities, photography, videography and media-related initiatives.',
    architecture: ['React frontend', 'Responsive UI', 'Media presentation', 'Web deployment']
  },

  {
    title: 'Quick Service',
    tag: 'Full-stack · Service marketplace',
    visual: 'market',
    text: 'A service marketplace concept connecting customers with service providers through an online platform.',
    tech: ['React', 'Node.js', 'Express', 'MongoDB', 'REST API'],
    link: '',
    color: '#FFF0D9',
    details: 'Designed around a marketplace workflow for discovering services and connecting customers with service providers. Focuses on service discovery and user-oriented interactions.',
    architecture: ['React frontend', 'Node.js + Express', 'MongoDB', 'REST API']
  },

  {
    title: 'College Complaint Box',
    tag: 'Full-stack · Campus management',
    visual: 'market',
    text: 'A web-based complaint management system that allows students to submit complaints and administrators to manage and track their resolution.',
    tech: ['MongoDB', 'Express', 'React', 'Node.js', 'MERN Stack'],
    link: '',
    color: '#FCE4E4',
    details: 'Designed to simplify complaint submission and management within a college environment through a centralized digital platform.',
    architecture: ['React frontend', 'Express REST API', 'MongoDB', 'Role-based workflows']
  },

  {
    title: 'Smart Canteen AI',
    tag: 'AI · Smart campus solution',
    visual: 'market',
    text: 'An AI-powered smart canteen concept designed to improve food ordering, canteen operations and the overall campus dining experience.',
    tech: ['React', 'Node.js', 'MongoDB', 'AI Integration'],
    link: '',
    color: '#FFF1D9',
    details: 'Explores the integration of artificial intelligence into campus food services, with a focus on improving the ordering experience and operational efficiency.',
    architecture: ['Frontend application', 'Backend API', 'MongoDB', 'AI integration']
  },

  {
    title: 'TalentMatch AI',
    tag: 'AI · Recruitment platform',
    visual: 'review',
    text: 'An AI-powered recruitment platform concept designed to improve candidate matching and simplify the recruitment process.',
    tech: ['React', 'Node.js', 'MongoDB', 'AI Integration'],
    link: '',
    color: '#E9E7FF',
    details: 'Explores intelligent candidate matching and AI-assisted recruitment workflows to help connect suitable candidates with relevant opportunities.',
    architecture: ['React frontend', 'Backend API', 'MongoDB', 'AI-powered matching']
  },
]

export const journey = [
  { year: 'Freelance', title: 'Freelance Web Developer', org: 'Draksha Ayurveda · Kottayam, Kerala', text: 'Designed and delivered a live website for an Ayurvedic clinic (drakshaayurveda.in).', photo: 'img/photos/portrait-tilt.jpg', note: 'first client site' },
  { year: '2026', title: 'Campus Twin', org: 'Final-year project · College of Engineering, Poonjar', text: 'Designed a role-based campus digital twin with maps, timetables, notices, complaints and service dashboards.', photo: 'img/photos/portrait-laptop.jpg', note: 'smart campus build' },
  { year: '2026', title: 'Revynix AI', org: 'AI-powered code review platform', text: 'May – June. Integrated an LLM API through OpenRouter, built JWT auth, an admin dashboard and deployed it.', photo: 'img/photos/portrait-laptop.jpg', note: 'my AI build!' },
  { year: '2026', title: 'Quick Service', org: 'Full-stack service marketplace', text: 'January – May. Booking, REST APIs, real-time chat with Socket.IO and Leaflet maps.', photo: 'img/photos/portrait-smile.jpg', note: 'real-time chat!' },
  { year: '2026', title: 'Frontend Development Intern', org: 'Syntecxhub · Remote', text: 'Worked on frontend development tasks during a one-month remote internship.', photo: 'img/photos/portrait-look.jpg', note: 'internship experience' },
  { year: '2023', title: 'B.Tech, Computer Science & Engineering', org: 'College of Engineering, Poonjar, Kottayam', text: '2023 – present. Learning Python automation, data analysis and dashboards on the side.', photo: 'img/photos/portrait-look.jpg', note: 'where it all started' },
]

export const skills = [
  'Python', 'JavaScript', 'C', 'React.js', 'Node.js', 'Express.js', 'HTML5', 'CSS3',
  'MongoDB', 'MySQL', 'REST APIs', 'JWT', 'Socket.IO', 'Leaflet', 'LLM APIs', 'OpenRouter',
  'Git', 'GitHub', 'Vercel', 'Render', 'Next.js', 'TypeScript', 'Redis', 'Cloudinary', 'PostgreSQL', 'OpenAI API',
]

// Milestones scoreboard. brand = icon key from src/lib/brands.js (or icon = any short glyph)
// value counts up, bar fills to value / goal
export const scoreboard = [
  { icon: '⚛', label: 'Full-stack projects', note: 'Revynix AI & Quick Service', value: 2, suffix: '', goal: 5 },
  { icon: '▲', label: 'Live client website', note: 'drakshaayurveda.in', value: 1, suffix: '', goal: 3 },
  { brand: 'mongodb', label: 'Databases', note: 'MongoDB & MySQL', value: 2, suffix: '', goal: 4 },
  { icon: '🌐', label: 'Languages spoken', note: 'English, Hindi, Malayalam', value: 3, suffix: '', goal: 5 },
]
// [title, issuer, brand icon key from src/lib/brands.js or a short glyph]
export const certifications = [
  ['AI Fluency: Framework & Foundation', 'Certification', '✦'],
  ['B.Tech · Computer Science & Engineering', 'College of Engineering, Poonjar', '🎓'],
  ['Draksha Ayurveda website', 'Live freelance project', '▲'],
  ['English · Hindi · Malayalam', 'Languages', '🌐'],
]

// cut-out frames used by the hero. One frame = a still sticker; add more frames to make it follow the cursor
export const lookFrames = { from: 0, to: 0 }
export const contactSticker = 'img/stickers/lg/f239.webp'

// Skills grouped for the 3D technology galaxy. Names must match entries in `skills`; anything not listed falls into "Tools & Technologies".
export const skillGroups = [
  { name: 'Frontend Development', blurb: 'Interfaces that feel fast, responsive and alive.', items: ['React.js', 'Next.js', 'HTML5', 'CSS3', 'Leaflet'] },
  { name: 'Backend Development', blurb: 'APIs, auth and real-time services.', items: ['Node.js', 'Express.js', 'REST APIs', 'JWT', 'Socket.IO', 'BullMQ'] },
  { name: 'Database', blurb: 'Data stores for apps that need to remember things.', items: ['MongoDB', 'MySQL', 'PostgreSQL', 'Redis'] },
  { name: 'Programming Languages', blurb: 'The languages I think in.', items: ['Python', 'JavaScript', 'TypeScript', 'C'] },
  { name: 'Tools & Technologies', blurb: 'Shipping, versioning and AI tooling.', items: ['Git', 'GitHub', 'Vercel', 'Render', 'Cloudinary', 'LLM APIs', 'OpenRouter', 'OpenAI API'] },
]

// Experience & leadership (shown in the Experience scene)
export const experience = [
  { date: '2026 · 1 month · Remote', title: 'Frontend Development Intern', org: 'Syntecxhub', text: 'Worked on frontend development tasks and strengthened practical skills in building responsive web interfaces.', chips: ['Frontend', 'React', 'GitHub'] },
  { date: '2026 · Freelance', title: 'Freelance Web Developer', org: 'Draksha Ayurveda & Wellness Centre', text: 'Delivered a live website for a real client, translating their requirements into a professional, responsive online presence.', chips: ['Client communication', 'Web development', 'Deployment'] },
  { date: '2026 · Student leadership', title: 'Chairperson', org: 'IEEE Communications Society · CEP', text: 'Helped lead student activities and technical engagement around communication technologies.', chips: ['Leadership', 'Coordination', 'Technical events'] },
]
