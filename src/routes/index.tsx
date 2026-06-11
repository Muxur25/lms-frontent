import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/layouts/AppLayout';
import AuthLayout from '@/layouts/AuthLayout';
import { ProtectedRoute } from '@/features/auth/ui/ProtectedRoute';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { Placeholder } from '@/components/Placeholder';

// Lazy loaded pages for performance optimization
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Courses = lazy(() => import('@/pages/Courses'));
const CoursePage = lazy(() => import('@/pages/CoursePage'));
const MyLearning = lazy(() => import('@/pages/MyLearning'));
const ExamPage = lazy(() => import('@/pages/ExamPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Employees = lazy(() => import('@/pages/Employees'));
const Certifications = lazy(() => import('@/pages/Certifications'));
const AiAssistant = lazy(() => import('@/pages/AiAssistant'));
const Webinars = lazy(() => import('@/pages/Webinars'));
const Library = lazy(() => import('@/pages/Library'));
const Schedule = lazy(() => import('@/pages/Schedule'));
const Notifications = lazy(() => import('@/pages/Notifications'));
const Settings = lazy(() => import('@/pages/Settings'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const VerifyCertificate = lazy(() => import('@/pages/VerifyCertificate'));

// Suspense Loader component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="skeleton w-16 h-16 rounded-full"></div>
  </div>
);

const NotFound = () => {
  const { t } = useTranslation();
  return (
    <div className="p-8 text-center text-[var(--text-tertiary)] flex flex-col items-center justify-center min-h-[400px]">
      <div className="text-4xl mb-4">🧭</div>
      <h2 className="text-xl font-bold mb-2">{t('layout.notFound')}</h2>
      <p>{t('layout.notFoundSub')}</p>
    </div>
  );
};

export const router = createBrowserRouter([
  // Landing Page at exact root
  {
    path: '/',
    errorElement: <ErrorBoundary />,
    element: <Suspense fallback={<PageLoader />}><LandingPage /></Suspense>,
  },
  // Public Certificate Verification Page
  {
    path: '/verify-certificate',
    errorElement: <ErrorBoundary />,
    element: <Suspense fallback={<PageLoader />}><VerifyCertificate /></Suspense>,
  },
  // Main App wrapped in AppLayout and ProtectedRoute
  {
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    errorElement: <ErrorBoundary />,
    children: [
      { 
        path: 'dashboard', 
        element: <Suspense fallback={<PageLoader />}><Dashboard /></Suspense> 
      },
      { 
        path: 'courses', 
        element: <Suspense fallback={<PageLoader />}><Courses /></Suspense> 
      },
      { 
        path: 'courses/:courseId', 
        element: <Suspense fallback={<PageLoader />}><CoursePage /></Suspense> 
      },
      { 
        path: 'mylearning', 
        element: <Suspense fallback={<PageLoader />}><MyLearning /></Suspense> 
      },
      { 
        path: 'assessments', 
        element: <Suspense fallback={<PageLoader />}><ExamPage /></Suspense> 
      },
      { 
        path: 'exams/:examId', 
        element: <Suspense fallback={<PageLoader />}><ExamPage /></Suspense> 
      },
      { 
        path: 'certifications', 
        element: <Suspense fallback={<PageLoader />}><Certifications /></Suspense> 
      },
      { 
        path: 'analytics', 
        element: <Suspense fallback={<PageLoader />}><Analytics /></Suspense> 
      },
      { 
        path: 'admin', 
        element: (
          <ProtectedRoute allowedRoles={['super_admin', 'admin', 'hr_manager']}>
            <Suspense fallback={<PageLoader />}><AdminPage /></Suspense>
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'employees', 
        element: <Suspense fallback={<PageLoader />}><Employees /></Suspense> 
      },
      { path: 'ai', element: <Suspense fallback={<PageLoader />}><AiAssistant /></Suspense> },
      { path: 'webinars', element: <Suspense fallback={<PageLoader />}><Webinars /></Suspense> },
      { path: 'library', element: <Suspense fallback={<PageLoader />}><Library /></Suspense> },
      { path: 'schedule', element: <Suspense fallback={<PageLoader />}><Schedule /></Suspense> },
      { path: 'leaderboard', element: <Suspense fallback={<PageLoader />}><Leaderboard /></Suspense> },
      { path: 'notifications', element: <Suspense fallback={<PageLoader />}><Notifications /></Suspense> },
      { path: 'settings', element: <Suspense fallback={<PageLoader />}><Settings /></Suspense> },
      // Catch all 404 inside layout
      { path: '*', element: <NotFound /> }
    ]
  },
  // Auth routes isolated from the main layout
  { 
    path: '/auth', 
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Suspense fallback={<PageLoader />}><Login /></Suspense> },
      { path: 'register', element: <Suspense fallback={<PageLoader />}><Register /></Suspense> },
      { path: 'forgot-password', element: <Placeholder title="Parolni tiklash" emoji="🔑" /> },
    ]
  },
  { path: '/unauthorized', element: <Placeholder title="Ruxsat etilmagan" emoji="⛔" /> }
]);
