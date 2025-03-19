# LeadLink CRM

A multi-tenant CRM system built with Next.js, Firebase, and TypeScript.

## Features

- Multi-tenant architecture
- Real-time data synchronization
- Role-based access control
- File storage and image processing
- Webhook integrations
- Activity logging
- Custom analytics

## Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Firebase CLI
- Git

## Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/leadlink-crm.git
cd leadlink-crm
```

2. Install dependencies:
```bash
npm install
cd functions && npm install && cd ..
```

3. Set up environment variables:
- Copy `.env.example` to `.env.dev`, `.env.staging`, and `.env.prod`
- Update the environment variables with your Firebase project credentials

4. Initialize Firebase:
```bash
firebase login
firebase init
```

## Development

1. Start the development server:
```bash
npm run dev
```

2. Start Firebase emulators:
```bash
npm run emulators
```

## Progressive Web App (PWA) Features

LeadLink CRM is implemented as a Progressive Web App, providing the following features:

- **Offline Support**: Continue working even without an internet connection
- **Installable**: Add to your home screen for quick access
- **Background Sync**: Changes made offline are synchronized when back online
- **Push Notifications**: Receive important alerts and updates
- **Fast Loading**: Cached resources for improved performance

## Monitoring and Feedback

The application includes comprehensive monitoring and feedback features:

- **Real-time Alerts**: Critical system alerts are displayed in real-time
- **User Feedback Collection**: Built-in mechanism for collecting user feedback
- **System Health Dashboard**: Monitor the health of all system components
- **Performance Metrics**: Track and visualize application performance

## Documentation and Help

LeadLink CRM includes comprehensive documentation and help systems:

- **Documentation Page**: Complete user guide with detailed instructions for all features
- **Context-Sensitive Help**: Smart help that adjusts based on your current page
- **Interactive Tooltips**: Hover over elements to get helpful explanations
- **In-App Help Panel**: Quick access to relevant help without leaving the application

## Deployment Status

The application is currently in its final phase of development before production launch:

- **PWA Implementation**: ✅ Complete 
- **Monitoring System**: ✅ Complete
- **CI/CD Pipeline**: ✅ Complete
- **SEO Implementation**: ✅ Complete
- **Analytics Integration**: ✅ Complete
- **Documentation & Help**: ✅ Complete
- **Production Deployment**: 🔄 In Progress

## Deployment

The project supports three environments: development, staging, and production.

### Environment Setup

1. Create Firebase projects for each environment:
   - leadlink-dev
   - leadlink-staging
   - leadlink-prod

2. Configure environment variables:
   - `.env.dev` for development
   - `.env.staging` for staging
   - `.env.prod` for production

### Deployment Process

Use the deployment script to deploy to different environments:

```bash
# Deploy to development
./scripts/deploy.sh dev

# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh prod
```

The deployment script will:
1. Load environment-specific variables
2. Build the application
3. Deploy to the specified Firebase project
4. Deploy both hosting and functions

### Manual Deployment

If you prefer to deploy manually:

1. Select the Firebase project:
```bash
firebase use [project-id]
```

2. Build the application:
```bash
npm run build
```

3. Deploy to Firebase:
```bash
firebase deploy
```

## Project Structure

```
leadlink-crm/
├── app/                  # Next.js app directory
├── components/          # React components
├── lib/                # Utility functions and Firebase setup
├── public/             # Static assets
├── functions/          # Firebase Cloud Functions
├── scripts/           # Deployment and utility scripts
└── types/             # TypeScript type definitions
```

## Contributing

1. Create a feature branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:
```bash
git commit -m "feat: add your feature"
```

3. Push to your branch:
```bash
git push origin feature/your-feature-name
```

4. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 