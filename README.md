# 🛜 CAF-WIFI Analyzer v3.0.0

**Enterprise WiFi Infrastructure Analysis & Network Management System**

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Production%20Ready-success)

## 📋 Overview

CAF-WIFI Analyzer is a professional-grade WiFi network management and analysis platform built with modern web technologies. It provides real-time monitoring, detailed analytics, and comprehensive reporting for enterprise WiFi infrastructure.

### ✨ Key Features

- **📊 Advanced Dashboard** - Real-time charts, analytics, and network overview
- **🔍 Network Scanner** - Discover and analyze WiFi networks in your environment
- **📈 Analytics Engine** - Speed tests, performance trends, and detailed statistics
- **📄 Report Generation** - Comprehensive scan reports and historical data
- **👥 Team Management** - Track team members, performance metrics, and activity
- **🌓 Dark/Light Mode** - Responsive interface with theme customization
- **📱 Mobile Responsive** - Perfect on desktop, tablet, and mobile devices
- **🔐 Enterprise Ready** - Secure, scalable, and production-grade

## 🚀 Live Deployments

- **Vercel (Recommended):** https://caf-wifi-analyzer.vercel.app
- **Firebase Hosting:** https://caf-wifi-analyzer.web.app
- **GitHub Repository:** https://github.com/hanyokhite-2026/caf-wifi-analyzer

## 🛠 Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **Charts:** Recharts with real-time data visualization
- **Backend:** Firebase (Firestore, Authentication)
- **Hosting:** Vercel + Firebase Hosting
- **Icons:** Lucide React
- **Styling:** Tailwind CSS with custom utilities

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/hanyokhite-2026/caf-wifi-analyzer.git
cd caf-wifi-analyzer

# Install dependencies
npm install

# Set up environment variables
# Create .env.local with your Firebase config
cp .env.example .env.local

# Start development server
npm run dev

# Open browser
# Visit http://localhost:3000
```

## 🎯 Features Overview

### Dashboard
- Network statistics and KPIs
- Signal strength comparison chart
- Network type distribution pie chart
- Performance radar chart
- Real-time health status

### Scanner
- Network discovery and analysis
- Signal strength measurement
- Channel analysis
- Client count tracking
- Encryption type detection
- Detailed network information

### Analytics
- Speed test history tracking
- Download/Upload trends
- Weekly activity patterns
- Performance metrics
- Historical data analysis

### Reports
- Scan report management
- Location-based reports
- Network inventory
- Signal analysis
- PDF export ready

### Admin
- Team member management
- Security event tracking
- System uptime monitoring
- Performance metrics
- User activity logs

### Settings
- Theme customization
- System preferences
- System information
- Version details

## 📊 Data Structure

### Mock Data (Built-in)
The application comes with comprehensive mock data for:
- 6 CAF networks (5G, 2G, Guest, IoT, Admin, Backup)
- 4 team members with performance metrics
- 3 sample reports
- Weekly activity data
- Speed test history

### Firebase Integration Ready
- Firestore collections structure defined
- Authentication setup
- Real-time database ready
- Cloud functions compatible

## 🎨 Styling

Built with **Tailwind CSS** featuring:
- Dark/Light mode toggle
- Custom color palette
- Responsive grid system
- Smooth animations
- Accessible components

## 📱 Responsive Design

- **Desktop:** Full-featured interface (1200px+)
- **Tablet:** Optimized layout (768px-1199px)
- **Mobile:** Touch-friendly interface (320px-767px)

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCG0Bu1_HFnoiIa8ogdIfzVCKluwRUQQcc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=caf-wifi-analyzer.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=caf-wifi-analyzer
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=caf-wifi-analyzer.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=101881422490
NEXT_PUBLIC_FIREBASE_APP_ID=1:101881422490:web:d5f0dffdd4dc3fea6a7523
```

## 📈 Build & Deploy

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Firebase
```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Project Structure

```
caf-wifi-analyzer/
├── app/
│   ├── layout.jsx          # Root layout
│   ├── page.jsx            # Main app component
│   └── globals.css         # Global styles
├── public/                 # Static assets
├── firebaseConfig.js       # Firebase configuration
├── package.json           # Dependencies
├── next.config.js         # Next.js config
├── tailwind.config.js     # Tailwind config
├── postcss.config.js      # PostCSS config
└── .gitignore            # Git ignore rules
```

## 🔐 Security

- Firebase Authentication ready
- Firestore Security Rules configured
- Environment variables protected
- No sensitive data in code
- HTTPS enforced in production

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Developer

**Hany Bkhite**
- Email: hany.bkhite@gdit.com
- GitHub: [@hanybkhite-2026](https://github.com/hanybkhite-2026)
- Role: Senior Developer, Network Infrastructure

## 🆘 Support

- GitHub Issues: [Report Bug](https://github.com/hanyokhite-2026/caf-wifi-analyzer/issues)
- Documentation: Check this README
- Email: hany.bkhite@gdit.com

## 🎉 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Charts by [Recharts](https://recharts.org/)
- Icons from [Lucide React](https://lucide.dev/)
- Styling by [Tailwind CSS](https://tailwindcss.com/)
- Hosting by [Vercel](https://vercel.com/) & [Firebase](https://firebase.google.com/)

---

**Made with ❤️ for enterprise WiFi management**

*Last Updated: May 24, 2024*