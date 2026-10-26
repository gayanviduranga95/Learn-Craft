import { useCallback, useEffect, useState } from 'react'
import Sidebar from '../components/dashboard/Sidebar'
import DashboardHeader from '../components/dashboard/DashboardHeader'
import WelcomeBanner from '../components/dashboard/WelcomeBanner'
import StatsRow from '../components/dashboard/StatsRow'
import CourseSection from '../components/dashboard/CourseSection'
import CourseLessons from '../components/dashboard/CourseLessons'
import ContinueLearning from '../components/dashboard/ContinueLearning'
import QuickActions from '../components/dashboard/QuickActions'
import LearningStreak from '../components/dashboard/LearningStreak'
import RecentAchievements from '../components/dashboard/RecentAchievements'
import RecommendedLessons from '../components/dashboard/RecommendedLessons'
import AITutorWidget from '../components/ai-tutor/AITutorWidget'
import QuizModal from '../components/quiz/QuizModal'
import { courseApi, certificateApi } from '../services/api'
import '../styles/dashboard.css'

export default function Dashboard() {
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseRefreshKey, setCourseRefreshKey] = useState(0)
  const [courses, setCourses] = useState([])
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [quizCourseId, setQuizCourseId] = useState(null)
  const [certMessage, setCertMessage] = useState('')

  useEffect(() => {
    let active = true

    async function fetchStats() {
      try {
        const data = await courseApi.getCourses()
        if (active && Array.isArray(data)) {
          setCourses(data)
        }
      } catch (err) {
        console.warn('Dashboard failed to load course stats:', err)
      }
    }

    fetchStats()

    return () => {
      active = false
    }
  }, [courseRefreshKey])

  const handleCourseSelected = useCallback((course) => {
    setSelectedCourse(course)
  }, [])

  const handleBackToCourses = useCallback(() => {
    setSelectedCourse(null)
  }, [])

  const handleProgressSaved = useCallback(() => {
    setCourseRefreshKey((current) => current + 1)
  }, [])

  const totalLessonsDone = courses.reduce(
    (acc, c) => acc + (c.completedLessons || 0),
    0
  )
  const completedCoursesCount = courses.filter((c) => c.progress >= 100).length
  const activeCourse =
    courses.find((c) => c.progress > 0 && c.progress < 100) || courses[0]

  const handleTakeQuiz = () => {
    const targetCourse = activeCourse || courses[0]
    if (targetCourse) {
      setQuizCourseId(targetCourse.id || targetCourse._id)
      setShowQuizModal(true)
    }
  }

  const handleExplore = () => {
    const el = document.getElementById('my-courses')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleDownloadCert = async () => {
    const completed = courses.find((c) => c.progress >= 100)
    if (!completed) {
      alert(
        'Complete 100% of all lessons in any course to unlock and download your verified PDF certificate!'
      )
      return
    }

    try {
      setCertMessage('Downloading certificate...')
      await certificateApi.downloadCertificate(
        completed.id || completed._id,
        completed.title
      )
      setCertMessage('Certificate downloaded successfully!')
      setTimeout(() => setCertMessage(''), 4000)
    } catch (err) {
      alert(err.message || 'Unable to download certificate.')
      setCertMessage('')
    }
  }

  return (
    <div className="dashboard">
      <Sidebar totalLessonsDone={totalLessonsDone} />

      <main className="dashboard-main">
        <DashboardHeader />

        <div className="dashboard-content">
          <WelcomeBanner />

          {certMessage && (
            <div style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', padding: '12px 18px', borderRadius: '10px', marginBottom: '18px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              {certMessage}
            </div>
          )}

          <StatsRow
            completedLessons={totalLessonsDone}
            totalCourses={courses.length}
            completedCourses={completedCoursesCount}
          />

          <div className="dashboard-columns">
            <div className="dashboard-primary">
              {selectedCourse ? (
                <CourseLessons
                  key={selectedCourse.id}
                  course={selectedCourse}
                  onBack={handleBackToCourses}
                  onProgressSaved={handleProgressSaved}
                />
              ) : (
                <>
                  <CourseSection
                    key={courseRefreshKey}
                    onCourseSelected={handleCourseSelected}
                  />
                  <ContinueLearning activeCourse={activeCourse} />
                  <QuickActions
                    onTakeQuiz={handleTakeQuiz}
                    onExplore={handleExplore}
                    onDownloadCert={handleDownloadCert}
                  />
                </>
              )}
            </div>

            <aside className="dashboard-secondary">
              <LearningStreak />
              <RecentAchievements
                completedLessons={totalLessonsDone}
                completedCourses={completedCoursesCount}
              />
              <RecommendedLessons />
            </aside>
          </div>
        </div>
      </main>

      <AITutorWidget />

      <QuizModal
        courseId={quizCourseId}
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
      />
    </div>
  )
}
