/**
 * OpenGig — Master Seed File
 * 100 courses · 6 Mentors · 20 Learners · smart enrollment patterns
 * Designed for collaborative filtering: Learners are grouped by interest
 * cluster so the ML model can find meaningful user-user similarities.
 *
 * Run: node seed.js
 */

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

// ─── Models ───────────────────────────────────────────────────────────────────
const User       = require("./models/User");
const Course     = require("./models/Course");
const Enrollment = require("./models/Enrollment");
const Review     = require("./models/Review");

// ─── DB ───────────────────────────────────────────────────────────────────────
const MONGO_URI = "mongodb://localhost:27017/opengig";

// ═════════════════════════════════════════════════════════════════════════════
// 1. MentorS (6)
// ═════════════════════════════════════════════════════════════════════════════
const MentorData = [
  { name: "Arjun Mehta",    email: "arjun@opengig.com",   speciality: "Web Development"    },
  { name: "Priya Sharma",   email: "priya@opengig.com",   speciality: "Data Science & ML"  },
  { name: "Rahul Verma",    email: "rahul@opengig.com",   speciality: "Mobile Development" },
  { name: "Sneha Patel",    email: "sneha@opengig.com",   speciality: "DevOps & Cloud"     },
  { name: "Vikram Singh",   email: "vikram@opengig.com",  speciality: "Cybersecurity"      },
  { name: "Deepika Nair",   email: "deepika@opengig.com", speciality: "UI/UX & Design"     },
];

// ═════════════════════════════════════════════════════════════════════════════
// 2. LearnerS (20) — grouped into 5 interest clusters for collaborative filter
//    Cluster A → Web + Frontend  (Learners 0-3)
//    Cluster B → Data + ML       (Learners 4-7)
//    Cluster C → Mobile + Apps   (Learners 8-11)
//    Cluster D → DevOps + Cloud  (Learners 12-15)
//    Cluster E → Security + Misc (Learners 16-19)
// ═════════════════════════════════════════════════════════════════════════════
const LearnerData = [
  // Cluster A — Web / Frontend
  { name: "Aarav Kumar",    email: "aarav@gmail.com"    },
  { name: "Ishaan Joshi",   email: "ishaan@gmail.com"   },
  { name: "Meera Reddy",    email: "meera@gmail.com"    },
  { name: "Rohan Gupta",    email: "rohan@gmail.com"    },
  // Cluster B — Data / ML
  { name: "Ananya Bose",    email: "ananya@gmail.com"   },
  { name: "Kabir Malhotra", email: "kabir@gmail.com"    },
  { name: "Lakshmi Iyer",   email: "lakshmi@gmail.com"  },
  { name: "Nikhil Das",     email: "nikhil@gmail.com"   },
  // Cluster C — Mobile / Apps
  { name: "Pooja Saxena",   email: "pooja@gmail.com"    },
  { name: "Raj Pillai",     email: "raj@gmail.com"      },
  { name: "Sanya Kapoor",   email: "sanya@gmail.com"    },
  { name: "Tarun Rao",      email: "tarun@gmail.com"    },
  // Cluster D — DevOps / Cloud
  { name: "Uday Mishra",    email: "uday@gmail.com"     },
  { name: "Vani Tiwari",    email: "vani@gmail.com"     },
  { name: "Yash Choudhary", email: "yash@gmail.com"     },
  { name: "Zara Khan",      email: "zara@gmail.com"     },
  // Cluster E — Security / Misc
  { name: "Amit Pandey",    email: "amit@gmail.com"     },
  { name: "Bharti Desai",   email: "bharti@gmail.com"   },
  { name: "Chirag Shah",    email: "chirag@gmail.com"   },
  { name: "Divya Menon",    email: "divya@gmail.com"    },
];

// ═════════════════════════════════════════════════════════════════════════════
// 3. ADMIN
// ═════════════════════════════════════════════════════════════════════════════
const adminData = {
  name:     "Super Admin",
  email:    "admin@opengig.com",
  password: "Admin@123",
  role:     "admin",
};

// ═════════════════════════════════════════════════════════════════════════════
// 4. 100 COURSES — 10 categories × 10 courses each
//    t0=Arjun(Web) t1=Priya(DS/ML) t2=Rahul(Mobile)
//    t3=Sneha(DevOps) t4=Vikram(Security) t5=Deepika(UI/UX)
// ═════════════════════════════════════════════════════════════════════════════
// courseData[i].Mentor → index into saved Mentors array
const courseData = [

  // ── Category 1: Web Development (10) ── Mentor: Arjun (0)
  { title: "HTML & CSS Fundamentals",           category: "Web Development",    price: 499,  level: "Beginner",     Mentor: 0, description: "Master the building blocks of the web. Learn semantic HTML5 and modern CSS3 including Flexbox and Grid layouts." },
  { title: "JavaScript from Zero to Hero",      category: "Web Development",    price: 799,  level: "Beginner",     Mentor: 0, description: "Complete JavaScript course covering ES6+, DOM manipulation, async/await, Promises and modern JS patterns." },
  { title: "React.js Complete Guide",           category: "Web Development",    price: 999,  level: "Intermediate", Mentor: 0, description: "Build powerful SPAs with React. Covers hooks, context API, Redux, React Router and real project development." },
  { title: "Node.js & Express Backend",         category: "Web Development",    price: 899,  level: "Intermediate", Mentor: 0, description: "Server-side JavaScript with Node.js and Express. REST APIs, middleware, authentication and MongoDB integration." },
  { title: "Full Stack MERN Development",       category: "Web Development",    price: 1499, level: "Advanced",     Mentor: 0, description: "End-to-end web application development using MongoDB, Express, React and Node.js with deployment." },
  { title: "Next.js & Server Side Rendering",   category: "Web Development",    price: 1099, level: "Advanced",     Mentor: 0, description: "Modern React framework with SSR, SSG, API routes, image optimization and Vercel deployment." },
  { title: "TypeScript for JavaScript Devs",    category: "Web Development",    price: 699,  level: "Intermediate", Mentor: 0, description: "Add static typing to JavaScript. Interfaces, generics, decorators and TypeScript with React and Node." },
  { title: "GraphQL API Development",           category: "Web Development",    price: 899,  level: "Advanced",     Mentor: 0, description: "Build flexible APIs with GraphQL. Schemas, resolvers, mutations, subscriptions and Apollo Server." },
  { title: "Web Performance Optimization",      category: "Web Development",    price: 799,  level: "Advanced",     Mentor: 0, description: "Make websites blazing fast. Lazy loading, code splitting, caching strategies, Core Web Vitals." },
  { title: "Progressive Web Apps (PWA)",        category: "Web Development",    price: 699,  level: "Intermediate", Mentor: 0, description: "Build app-like experiences on the web. Service workers, offline mode, push notifications and installability." },

  // ── Category 2: Data Science (10) ── Mentor: Priya (1)
  { title: "Python for Data Science",           category: "Data Science",       price: 799,  level: "Beginner",     Mentor: 1, description: "Python fundamentals tailored for data analysis. NumPy, Pandas, Matplotlib and exploratory data analysis." },
  { title: "Statistics for Data Scientists",    category: "Data Science",       price: 699,  level: "Beginner",     Mentor: 1, description: "Probability, distributions, hypothesis testing and statistical inference with real-world examples." },
  { title: "Data Visualization with Python",    category: "Data Science",       price: 699,  level: "Intermediate", Mentor: 1, description: "Create compelling charts and dashboards using Matplotlib, Seaborn, Plotly and Tableau integration." },
  { title: "SQL & Database for Analysts",       category: "Data Science",       price: 599,  level: "Beginner",     Mentor: 1, description: "Query databases like a pro. Advanced SQL, window functions, joins, subqueries and query optimization." },
  { title: "Machine Learning Fundamentals",     category: "Data Science",       price: 1099, level: "Intermediate", Mentor: 1, description: "Supervised and unsupervised learning algorithms. Linear regression, decision trees, clustering and evaluation." },
  { title: "Feature Engineering Mastery",       category: "Data Science",       price: 899,  level: "Intermediate", Mentor: 1, description: "Transform raw data into powerful features. Encoding, scaling, selection, extraction and dimensionality reduction." },
  { title: "Time Series Analysis",              category: "Data Science",       price: 999,  level: "Advanced",     Mentor: 1, description: "Analyze temporal data with ARIMA, Prophet, LSTM and practical forecasting for business applications." },
  { title: "Big Data with PySpark",             category: "Data Science",       price: 1199, level: "Advanced",     Mentor: 1, description: "Process massive datasets using Apache Spark. RDDs, DataFrames, Spark SQL and cluster computing." },
  { title: "Data Wrangling & Cleaning",         category: "Data Science",       price: 699,  level: "Intermediate", Mentor: 1, description: "Handle messy real-world data. Missing values, outliers, data quality and automated cleaning pipelines." },
  { title: "Business Analytics with Power BI",  category: "Data Science",       price: 799,  level: "Beginner",     Mentor: 1, description: "Turn business data into insights. Power BI dashboards, DAX formulas and storytelling with data." },

  // ── Category 3: Machine Learning & AI (10) ── Mentor: Priya (1)
  { title: "Deep Learning with TensorFlow",     category: "Machine Learning",   price: 1299, level: "Advanced",     Mentor: 1, description: "Neural networks from scratch. CNNs, RNNs, LSTMs, transfer learning and model deployment with TF Serving." },
  { title: "Natural Language Processing",       category: "Machine Learning",   price: 1199, level: "Advanced",     Mentor: 1, description: "Text processing, sentiment analysis, named entity recognition, transformers and BERT fine-tuning." },
  { title: "Computer Vision with OpenCV",       category: "Machine Learning",   price: 1099, level: "Advanced",     Mentor: 1, description: "Image processing, object detection, YOLO, face recognition and real-time video analysis." },
  { title: "Recommendation Systems",            category: "Machine Learning",   price: 999,  level: "Advanced",     Mentor: 1, description: "Build collaborative and content-based recommenders. Matrix factorization, deep learning and A/B testing." },
  { title: "Reinforcement Learning",            category: "Machine Learning",   price: 1299, level: "Advanced",     Mentor: 1, description: "Train agents to make decisions. Q-learning, policy gradients, OpenAI Gym and real-world applications." },
  { title: "MLOps & Model Deployment",          category: "Machine Learning",   price: 1099, level: "Advanced",     Mentor: 1, description: "Deploy ML models to production. Docker, FastAPI, MLflow, monitoring and CI/CD for ML pipelines." },
  { title: "Generative AI & LLMs",              category: "Machine Learning",   price: 1499, level: "Advanced",     Mentor: 1, description: "Work with large language models. Prompt engineering, fine-tuning, RAG and building LLM-powered apps." },
  { title: "Scikit-Learn for ML Engineers",     category: "Machine Learning",   price: 899,  level: "Intermediate", Mentor: 1, description: "Master scikit-learn for production ML. Pipelines, custom transformers, model selection and hyperparameter tuning." },
  { title: "Neural Networks from Scratch",      category: "Machine Learning",   price: 999,  level: "Intermediate", Mentor: 1, description: "Build and understand neural networks without libraries. Backpropagation, gradient descent from first principles." },
  { title: "AI Ethics & Responsible ML",        category: "Machine Learning",   price: 699,  level: "Beginner",     Mentor: 1, description: "Fairness, accountability and transparency in AI. Bias detection, explainability and ethical AI frameworks." },

  // ── Category 4: Mobile Development (10) ── Mentor: Rahul (2)
  { title: "Android Development with Kotlin",   category: "Mobile Development", price: 999,  level: "Intermediate", Mentor: 2, description: "Build native Android apps with Kotlin. Activities, fragments, RecyclerView, Room DB and Jetpack Compose." },
  { title: "iOS Development with Swift",        category: "Mobile Development", price: 1099, level: "Intermediate", Mentor: 2, description: "Create iOS applications using Swift and Xcode. UIKit, SwiftUI, CoreData and App Store deployment." },
  { title: "React Native Cross-Platform Apps",  category: "Mobile Development", price: 999,  level: "Intermediate", Mentor: 2, description: "Build iOS and Android apps with one codebase using React Native. Navigation, native modules and Expo." },
  { title: "Flutter & Dart Complete Course",    category: "Mobile Development", price: 999,  level: "Intermediate", Mentor: 2, description: "Google's UI toolkit for cross-platform apps. Widgets, state management, Firebase and Play Store deployment." },
  { title: "Mobile UI/UX Design Principles",    category: "Mobile Development", price: 699,  level: "Beginner",     Mentor: 2, description: "Design beautiful mobile interfaces. Human interface guidelines, material design and mobile prototyping." },
  { title: "Firebase for Mobile Apps",          category: "Mobile Development", price: 799,  level: "Intermediate", Mentor: 2, description: "Backend as a service for mobile. Authentication, Firestore, real-time DB, Cloud Functions and FCM push notifications." },
  { title: "Mobile App Testing & QA",           category: "Mobile Development", price: 699,  level: "Intermediate", Mentor: 2, description: "Ensure app quality with automated testing. Espresso, XCTest, Appium and performance profiling." },
  { title: "App Monetization Strategies",       category: "Mobile Development", price: 599,  level: "Beginner",     Mentor: 2, description: "Monetize your mobile apps. In-app purchases, subscriptions, ads, freemium models and analytics." },
  { title: "Mobile Security Best Practices",    category: "Mobile Development", price: 799,  level: "Advanced",     Mentor: 2, description: "Secure your mobile apps. Certificate pinning, data encryption, OAuth2, and OWASP mobile top 10." },
  { title: "Jetpack Compose Masterclass",       category: "Mobile Development", price: 999,  level: "Advanced",     Mentor: 2, description: "Modern Android UI development with Jetpack Compose. Composables, theming, animations and architecture." },

  // ── Category 5: DevOps & Cloud (10) ── Mentor: Sneha (3)
  { title: "Linux for Developers",              category: "DevOps & Cloud",     price: 599,  level: "Beginner",     Mentor: 3, description: "Master the Linux command line. File system, shell scripting, process management and server administration." },
  { title: "Docker & Containerization",         category: "DevOps & Cloud",     price: 799,  level: "Intermediate", Mentor: 3, description: "Containerize applications with Docker. Images, volumes, networking, Docker Compose and best practices." },
  { title: "Kubernetes Orchestration",          category: "DevOps & Cloud",     price: 1099, level: "Advanced",     Mentor: 3, description: "Manage containers at scale with Kubernetes. Pods, services, deployments, Helm charts and cluster management." },
  { title: "AWS Cloud Practitioner",            category: "DevOps & Cloud",     price: 999,  level: "Beginner",     Mentor: 3, description: "Amazon Web Services fundamentals. EC2, S3, RDS, Lambda, VPC and preparing for AWS certification." },
  { title: "CI/CD with Jenkins & GitHub Actions", category: "DevOps & Cloud",  price: 899,  level: "Intermediate", Mentor: 3, description: "Automate your software delivery. Pipelines, automated testing, deployment strategies and GitOps." },
  { title: "Infrastructure as Code with Terraform", category: "DevOps & Cloud", price: 999, level: "Advanced",     Mentor: 3, description: "Provision cloud resources with code. Terraform modules, state management, AWS and GCP provisioning." },
  { title: "Monitoring with Prometheus & Grafana", category: "DevOps & Cloud", price: 799,  level: "Intermediate", Mentor: 3, description: "Observe your systems in production. Metrics, alerts, dashboards and incident response workflows." },
  { title: "Google Cloud Platform Essentials",  category: "DevOps & Cloud",     price: 999,  level: "Intermediate", Mentor: 3, description: "GCP services for developers. Compute Engine, BigQuery, GKE, Cloud Run and GCP certifications." },
  { title: "DevSecOps Practices",               category: "DevOps & Cloud",     price: 1099, level: "Advanced",     Mentor: 3, description: "Integrate security into DevOps. SAST, DAST, container scanning, secret management and compliance." },
  { title: "Site Reliability Engineering (SRE)", category: "DevOps & Cloud",   price: 1199, level: "Advanced",     Mentor: 3, description: "Keep systems reliable at scale. SLOs, SLAs, error budgets, on-call practices and postmortems." },

  // ── Category 6: Cybersecurity (10) ── Mentor: Vikram (4)
  { title: "Ethical Hacking Fundamentals",      category: "Cybersecurity",      price: 999,  level: "Beginner",     Mentor: 4, description: "Introduction to ethical hacking. Footprinting, scanning, enumeration and basic exploitation techniques." },
  { title: "Network Security & Protocols",      category: "Cybersecurity",      price: 899,  level: "Intermediate", Mentor: 4, description: "Secure network infrastructure. TCP/IP, firewalls, IDS/IPS, VPNs and packet analysis with Wireshark." },
  { title: "Web Application Security",          category: "Cybersecurity",      price: 1099, level: "Intermediate", Mentor: 4, description: "OWASP Top 10, SQL injection, XSS, CSRF, authentication flaws and secure coding practices." },
  { title: "Penetration Testing with Kali Linux", category: "Cybersecurity",   price: 1199, level: "Advanced",     Mentor: 4, description: "Real-world pen testing. Metasploit, Burp Suite, Nmap, exploitation and professional report writing." },
  { title: "Cryptography & PKI",                category: "Cybersecurity",      price: 799,  level: "Intermediate", Mentor: 4, description: "Encryption algorithms, hashing, digital signatures, certificates and TLS/SSL implementation." },
  { title: "Incident Response & Forensics",     category: "Cybersecurity",      price: 999,  level: "Advanced",     Mentor: 4, description: "Respond to security breaches. Evidence collection, memory forensics, log analysis and chain of custody." },
  { title: "Cloud Security on AWS & Azure",     category: "Cybersecurity",      price: 1099, level: "Advanced",     Mentor: 4, description: "Secure cloud environments. IAM, security groups, encryption, compliance and cloud threat modeling." },
  { title: "Bug Bounty Hunting",                category: "Cybersecurity",      price: 899,  level: "Intermediate", Mentor: 4, description: "Find and report vulnerabilities for rewards. Platforms, methodology, report writing and program rules." },
  { title: "SOC Analyst Training",              category: "Cybersecurity",      price: 999,  level: "Intermediate", Mentor: 4, description: "Security Operations Center skills. SIEM, threat hunting, alert triage and incident escalation." },
  { title: "Zero Trust Security Architecture",  category: "Cybersecurity",      price: 1199, level: "Advanced",     Mentor: 4, description: "Implement never-trust-always-verify. Identity, micro-segmentation, least privilege and ZT frameworks." },

  // ── Category 7: UI/UX Design (10) ── Mentor: Deepika (5)
  { title: "UI Design Fundamentals",            category: "UI/UX Design",       price: 699,  level: "Beginner",     Mentor: 5, description: "Core principles of interface design. Color theory, typography, spacing, contrast and visual hierarchy." },
  { title: "Figma Complete Masterclass",        category: "UI/UX Design",       price: 799,  level: "Intermediate", Mentor: 5, description: "Design, prototype and collaborate in Figma. Components, auto-layout, variants and developer handoff." },
  { title: "UX Research Methods",               category: "UI/UX Design",       price: 699,  level: "Intermediate", Mentor: 5, description: "Understand users through research. Interviews, surveys, usability testing, affinity mapping and personas." },
  { title: "Design Systems & Component Libraries", category: "UI/UX Design",   price: 899,  level: "Advanced",     Mentor: 5, description: "Build scalable design systems. Tokens, components, documentation, Storybook and design-dev sync." },
  { title: "Mobile App UI Design",              category: "UI/UX Design",       price: 799,  level: "Intermediate", Mentor: 5, description: "Design intuitive mobile interfaces. iOS HIG, Material Design, gesture-based navigation and accessibility." },
  { title: "Web Design with Adobe XD",          category: "UI/UX Design",       price: 699,  level: "Beginner",     Mentor: 5, description: "Create stunning web designs with Adobe XD. Wireframes, prototypes, animations and client presentations." },
  { title: "Motion Design & Micro-animations",  category: "UI/UX Design",       price: 899,  level: "Advanced",     Mentor: 5, description: "Bring interfaces to life. Principles of motion, After Effects, Lottie and meaningful UI animations." },
  { title: "Accessibility & Inclusive Design",  category: "UI/UX Design",       price: 699,  level: "Intermediate", Mentor: 5, description: "Design for everyone. WCAG guidelines, screen readers, color contrast, keyboard navigation and ARIA." },
  { title: "Product Design Thinking",           category: "UI/UX Design",       price: 799,  level: "Intermediate", Mentor: 5, description: "Design thinking process from empathy to prototype. Problem framing, ideation and iteration methods." },
  { title: "Portfolio Building for Designers",  category: "UI/UX Design",       price: 599,  level: "Beginner",     Mentor: 5, description: "Build a job-winning design portfolio. Case studies, presenting work, Behance and landing your first job." },

  // ── Category 8: Database & Backend (10) ── Mentor: Arjun (0)
  { title: "MongoDB & Mongoose Deep Dive",      category: "Database",           price: 699,  level: "Intermediate", Mentor: 0, description: "Advanced MongoDB. Aggregation pipeline, indexes, sharding, replication and Mongoose advanced patterns." },
  { title: "PostgreSQL for Developers",         category: "Database",           price: 699,  level: "Intermediate", Mentor: 0, description: "Relational database mastery. Advanced queries, triggers, stored procedures, JSON support and performance." },
  { title: "Redis Caching & Pub/Sub",           category: "Database",           price: 699,  level: "Intermediate", Mentor: 0, description: "In-memory data structures. Caching strategies, sessions, queues, pub/sub and Redis Cluster." },
  { title: "Database Design & Modeling",        category: "Database",           price: 599,  level: "Beginner",     Mentor: 0, description: "Design robust databases. ER diagrams, normalization, relationships, indexing strategy and schema design." },
  { title: "Microservices Architecture",        category: "Database",           price: 1099, level: "Advanced",     Mentor: 0, description: "Break monoliths into microservices. Service discovery, API gateway, event-driven communication and resilience." },
  { title: "REST API Design Best Practices",    category: "Database",           price: 699,  level: "Intermediate", Mentor: 0, description: "Design APIs that developers love. Versioning, pagination, error handling, security and API documentation." },
  { title: "Message Queues with RabbitMQ",      category: "Database",           price: 799,  level: "Advanced",     Mentor: 0, description: "Asynchronous communication with queues. Exchanges, routing, dead letters, reliability and scalability." },
  { title: "Elasticsearch & Search Engines",    category: "Database",           price: 899,  level: "Advanced",     Mentor: 0, description: "Build powerful search features. Indexing, querying, aggregations, relevance tuning and ELK Stack." },
  { title: "WebSockets & Real-time Systems",    category: "Database",           price: 799,  level: "Intermediate", Mentor: 0, description: "Build real-time features with WebSockets and Socket.io. Chat, notifications, live updates and scaling." },
  { title: "System Design for Interviews",      category: "Database",           price: 1199, level: "Advanced",     Mentor: 0, description: "Crack system design interviews. Scalability, load balancing, caching, CAP theorem and designing at scale." },

  // ── Category 9: Blockchain & Web3 (10) ── Mentor: Vikram (4)
  { title: "Blockchain Fundamentals",           category: "Blockchain",         price: 799,  level: "Beginner",     Mentor: 4, description: "How blockchain works. Distributed ledger, consensus mechanisms, cryptographic hashing and nodes." },
  { title: "Solidity Smart Contracts",          category: "Blockchain",         price: 1099, level: "Intermediate", Mentor: 4, description: "Write smart contracts in Solidity. Data types, functions, events, modifiers, gas optimization." },
  { title: "Ethereum DApp Development",         category: "Blockchain",         price: 1199, level: "Advanced",     Mentor: 4, description: "Build decentralized applications on Ethereum. Web3.js, ethers.js, MetaMask, IPFS and DeFi protocols." },
  { title: "NFT Development & Marketplaces",    category: "Blockchain",         price: 999,  level: "Advanced",     Mentor: 4, description: "Create and sell NFTs. ERC-721, ERC-1155, marketplace contracts, metadata and OpenSea integration." },
  { title: "DeFi Protocols & Yield Farming",    category: "Blockchain",         price: 1299, level: "Advanced",     Mentor: 4, description: "Decentralized finance mechanics. Lending, AMMs, liquidity pools, governance and yield strategies." },
  { title: "Web3.js & Ethers.js",               category: "Blockchain",         price: 899,  level: "Intermediate", Mentor: 4, description: "Interact with Ethereum blockchain from JavaScript. Transactions, contracts, wallets and event listening." },
  { title: "Hardhat Development Environment",   category: "Blockchain",         price: 799,  level: "Intermediate", Mentor: 4, description: "Professional smart contract development. Testing, deployment, debugging, task plugins and mainnet forking." },
  { title: "Blockchain Security & Auditing",    category: "Blockchain",         price: 1199, level: "Advanced",     Mentor: 4, description: "Audit smart contracts for vulnerabilities. Reentrancy, flash loans, access control and security tools." },
  { title: "Polygon & Layer 2 Solutions",       category: "Blockchain",         price: 999,  level: "Advanced",     Mentor: 4, description: "Scale Ethereum with Layer 2. Polygon, Optimism, Arbitrum, bridges and cross-chain development." },
  { title: "Crypto Trading & Technical Analysis", category: "Blockchain",       price: 699,  level: "Beginner",     Mentor: 4, description: "Read crypto markets. Charts, indicators, patterns, risk management and trading psychology." },

  // ── Category 10: DSA & Programming (10) ── Mentor: Arjun (0)
  { title: "Data Structures & Algorithms",      category: "DSA & Programming",  price: 999,  level: "Intermediate", Mentor: 0, description: "Master arrays, linked lists, trees, graphs, sorting and dynamic programming for interview success." },
  { title: "Competitive Programming with C++",  category: "DSA & Programming",  price: 899,  level: "Advanced",     Mentor: 0, description: "Win coding competitions. STL, bit manipulation, segment trees, graph algorithms and contest strategies." },
  { title: "Python Programming Masterclass",    category: "DSA & Programming",  price: 699,  level: "Beginner",     Mentor: 0, description: "Complete Python from basics to OOP. File handling, decorators, generators and Python ecosystem." },
  { title: "Java Complete Bootcamp",            category: "DSA & Programming",  price: 799,  level: "Intermediate", Mentor: 0, description: "Core Java, OOP, collections, streams, lambdas, Spring Boot basics and Java interview preparation." },
  { title: "System Design & LLD",               category: "DSA & Programming",  price: 1299, level: "Advanced",     Mentor: 0, description: "Low-level design for interviews. SOLID principles, design patterns, class diagrams and real system design." },
  { title: "FAANG Interview Preparation",       category: "DSA & Programming",  price: 1499, level: "Advanced",     Mentor: 0, description: "Crack top tech interviews. 200+ problems, behavioral questions, mock interviews and offer negotiation." },
  { title: "Operating Systems Concepts",        category: "DSA & Programming",  price: 699,  level: "Intermediate", Mentor: 0, description: "CS fundamentals: processes, threads, memory management, file systems, deadlocks and scheduling algorithms." },
  { title: "Computer Networks Fundamentals",    category: "DSA & Programming",  price: 699,  level: "Intermediate", Mentor: 0, description: "Networking for developers. OSI model, TCP/IP, HTTP, DNS, routing and network security basics." },
  { title: "Git & Version Control",             category: "DSA & Programming",  price: 399,  level: "Beginner",     Mentor: 0, description: "Master Git workflows. Branching strategies, merge conflicts, rebasing, GitHub Actions and team collaboration." },
  { title: "Problem Solving with Dynamic Programming", category: "DSA & Programming", price: 999, level: "Advanced", Mentor: 0, description: "Conquer DP problems. Memoization, tabulation, classic patterns and 50+ DP problems with visual explanations." },
];

// ═════════════════════════════════════════════════════════════════════════════
// 5. ENROLLMENT PATTERNS — collaborative filtering clusters
//    Each cluster covers its primary category heavily + 1-2 cross-over cats
//    This creates meaningful user-user similarity for the recommender
// ═════════════════════════════════════════════════════════════════════════════
// Course indices by category (0-indexed):
//   Web Dev    : 0-9
//   Data Sci   : 10-19
//   ML/AI      : 20-29
//   Mobile     : 30-39
//   DevOps     : 40-49
//   Security   : 50-59
//   UI/UX      : 60-69
//   Database   : 70-79
//   Blockchain : 80-89
//   DSA        : 90-99

const enrollmentClusters = [
  // Cluster A — Web + UI/UX + DB (Learners 0-3)
  { LearnerIndices: [0, 1, 2, 3], courseIndices: [0,1,2,3,4,5,6,7,60,61,62,63,70,71,72,73,90,91,93] },

  // Cluster B — Data Science + ML (Learners 4-7)
  { LearnerIndices: [4, 5, 6, 7], courseIndices: [10,11,12,13,14,15,16,17,18,20,21,22,23,24,25,26,27,90,92,95] },

  // Cluster C — Mobile + UI/UX (Learners 8-11)
  { LearnerIndices: [8, 9, 10, 11], courseIndices: [30,31,32,33,34,35,36,37,38,60,61,64,65,66,67,0,1,2] },

  // Cluster D — DevOps + Cloud + DB + Security (Learners 12-15)
  { LearnerIndices: [12, 13, 14, 15], courseIndices: [40,41,42,43,44,45,46,47,48,49,50,52,54,70,72,74,76,78] },

  // Cluster E — Security + Blockchain + DSA (Learners 16-19)
  { LearnerIndices: [16, 17, 18, 19], courseIndices: [50,51,52,53,54,55,56,57,80,81,82,83,84,90,91,94,95,96,99] },
];

// Sample reviews pool
const reviewTexts = [
  { rating: 5, comment: "Absolutely loved this course! Very detailed and practical." },
  { rating: 5, comment: "Best course on this topic I've found. Highly recommended!" },
  { rating: 4, comment: "Great content, well structured. Could use more exercises." },
  { rating: 4, comment: "Very informative. The instructor explains concepts clearly." },
  { rating: 5, comment: "Exceeded my expectations. Real-world examples are excellent." },
  { rating: 3, comment: "Good course but some sections felt rushed." },
  { rating: 5, comment: "Life-changing course. Got a job after completing this!" },
  { rating: 4, comment: "Solid course with good depth. Worth every rupee." },
  { rating: 5, comment: "The projects in this course are incredibly practical." },
  { rating: 4, comment: "Well-paced and comprehensive. Great for beginners." },
];

// ═════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═════════════════════════════════════════════════════════════════════════════
async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB — opengig");

    // ── Wipe existing data ──────────────────────────────────────────────────
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Enrollment.deleteMany({}),
      Review.deleteMany({}),
    ]);
    console.log("🗑️  Cleared existing data");

    const hashedPassword = await bcrypt.hash("Password@123", 10);

    // ── Create Admin ────────────────────────────────────────────────────────
    const admin = await User.create({
      name:     adminData.name,
      email:    adminData.email,
      password: await bcrypt.hash(adminData.password, 10),
      role:     "admin",
      isBlocked: false,
    });
    console.log("👑 Admin created");

    // ── Create Mentors ─────────────────────────────────────────────────────
    const Mentors = await User.insertMany(
      MentorData.map(t => ({
        name:      t.name,
        email:     t.email,
        password:  hashedPassword,
        role:      "Mentor",
        bio:       `Expert in ${t.speciality} with 5+ years of teaching experience.`,
        isBlocked: false,
      }))
    );
    console.log(`👨‍🏫 ${Mentors.length} Mentors created`);

    // ── Create Learners ─────────────────────────────────────────────────────
    const Learners = await User.insertMany(
      LearnerData.map(t => ({
        name:      t.name,
        email:     t.email,
        password:  hashedPassword,
        role:      "Learner",
        isBlocked: false,
      }))
    );
    console.log(`👩‍🎓 ${Learners.length} Learners created`);

    // ── Create 100 Courses ──────────────────────────────────────────────────
    const courses = await Course.insertMany(
      courseData.map(c => ({
        title:       c.title,
        description: c.description,
        category:    c.category,
        price:       c.price,
        level:       c.level,
        Mentor:     Mentors[c.Mentor]._id,
        thumbnail:   `https://picsum.photos/seed/${encodeURIComponent(c.title)}/400/250`,
        duration:    `${Math.floor(Math.random() * 20) + 10} hours`,
        tags:        [c.category, c.level, "OpenGig"],
        isPublished: true,
      }))
    );
    console.log(`📚 ${courses.length} courses created`);

    // ── Create Enrollments & Reviews (cluster-based) ────────────────────────
    let enrollmentCount = 0;
    let reviewCount     = 0;

    for (const cluster of enrollmentClusters) {
      for (const tIdx of cluster.LearnerIndices) {
        const Learner = Learners[tIdx];

        // Each Learner enrolls in most cluster courses + a few random extras
        const extras = [];
        while (extras.length < 3) {
          const r = Math.floor(Math.random() * 100);
          if (!cluster.courseIndices.includes(r)) extras.push(r);
        }
        const allCourses = [...new Set([...cluster.courseIndices, ...extras])];

        for (const cIdx of allCourses) {
          const course = courses[cIdx];
          const progress  = Math.floor(Math.random() * 101);
          const completed = progress === 100;

          const enrollment = await Enrollment.create({
            Learner:   Learner._id,
            course:    course._id,
            progress,
            completed,
            enrolledAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
          });
          enrollmentCount++;

          // 60% chance of leaving a review if progress > 30%
          if (progress > 30 && Math.random() < 0.6) {
            const rv = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
            await Review.create({
              Learner:    Learner._id,
              course:     course._id,
              enrollment: enrollment._id,
              rating:     rv.rating,
              comment:    rv.comment,
            });
            reviewCount++;
          }
        }
      }
    }

    console.log(`📋 ${enrollmentCount} enrollments created`);
    console.log(`⭐ ${reviewCount} reviews created`);

    // ── Summary ─────────────────────────────────────────────────────────────
    console.log("\n════════════════════════════════════");
    console.log("  OpenGig Seed Complete! 🚀");
    console.log("════════════════════════════════════");
    console.log(`  Admin    : admin@opengig.com / Admin@123`);
    console.log(`  Mentors : [email]@opengig.com / Password@123`);
    console.log(`  Learners : [email]@gmail.com  / Password@123`);
    console.log(`  Courses  : ${courses.length}`);
    console.log(`  Enrollments: ${enrollmentCount}`);
    console.log(`  Reviews  : ${reviewCount}`);
    console.log("════════════════════════════════════\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();