import LoginForm from '@/components/LoginForm'
export const dynamic = 'force-dynamic'
export default function LoginPage() {
  return <LoginForm google={!!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} apple={!!(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET)} emailLink={!!(process.env.EMAIL_SERVER && process.env.EMAIL_FROM)} />
}
