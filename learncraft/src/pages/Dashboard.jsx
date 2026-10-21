import Sidebar from '../components/dashboard/Sidebar'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import WelcomeBanner from '../components/dashboard/WelcomeBanner'
import StatsRow from '../components/dashboard/StatsRow'
import CourseSection from '../components/dashboard/CourseSection'
import ContinueLearning from '../components/dashboard/ContinueLearning'
import QuickActions from '../components/dashboard/QuickActions'
import LearningStreak from '../components/dashboard/LearningStreak'
import RecentAchievements from '../components/dashboard/RecentAchievements'
import RecommendedLessons from '../components/dashboard/RecommendedLessons'
import AITutorWidget from '../components/ai-tutor/AITutorWidget'
import '../styles/dashboard.css'

export default function Dashboard() {
  return (
    <div className="dashboard">
      <Sidebar />

      <main className="dashboard-main">
        <DashboardHeader />

        <div className="dashboard-content">
          <WelcomeBanner />
          <StatsRow />

          <div className="dashboard-columns">
            <div className="dashboard-primary">
              <CourseSection />
              <ContinueLearning />
              <QuickActions />
            </div>

            <aside className="dashboard-secondary">
              <LearningStreak />
              <RecentAchievements />
              <RecommendedLessons />
            </aside>
          </div>
        </div>
      </main>

      <AITutorWidget />
    </div>
  )
}
