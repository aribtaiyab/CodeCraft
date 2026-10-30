import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '../../components'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <AlertCircle size={40} strokeWidth={1.5} />
        </div>
        <div className={styles.code}>404</div>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.desc}>
          This route doesn't exist in the CodeCraft app. Check the URL or navigate back to a known page.
        </p>
        <Button
          variant="primary"
          size="md"
          iconLeft={<ArrowLeft size={16} />}
          onClick={() => navigate('/')}
        >
          Back to home
        </Button>
      </div>
    </div>
  )
}
