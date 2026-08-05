'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn, signUp } from '@/features/auth/api'
import { useLocale } from '@/lib/i18n/provider'
import { t } from '@/lib/i18n/messages'

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type SignInValues = z.infer<typeof signInSchema>
type SignUpValues = z.infer<typeof signUpSchema>

type AuthFormProps = {
  onSuccess: () => void
}

const fieldClassName =
  'mt-1 block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30'

export function AuthForm({ onSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false)

  return (
    <AuthFormFields
      key={isSignUp ? 'signup' : 'signin'}
      isSignUp={isSignUp}
      onToggle={() => setIsSignUp((prev) => !prev)}
      onSuccess={onSuccess}
    />
  )
}

function AuthFormFields({
  isSignUp,
  onToggle,
  onSuccess,
}: {
  isSignUp: boolean
  onToggle: () => void
  onSuccess: () => void
}) {
  const { locale } = useLocale()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues | SignUpValues>({
    resolver: zodResolver(isSignUp ? signUpSchema : signInSchema),
  })

  const onSubmit = async (data: SignInValues | SignUpValues) => {
    try {
      setError(null)
      if (isSignUp && 'name' in data) {
        await signUp(data.email, data.password, data.name)
      } else {
        await signIn(data.email, data.password)
      }
      onSuccess()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    }
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div>
        <h1 className="text-center text-3xl font-semibold tracking-tight text-[var(--color-text)]">
          To Do
        </h1>
        <p className="mt-2 text-center text-sm text-[var(--color-text-secondary)]">
          {isSignUp ? t(locale, 'auth.signUp') : t(locale, 'auth.signIn')}
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        {isSignUp && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text)]">
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              className={fieldClassName}
              {...register('name')}
            />
            {'name' in errors && errors.name && (
              <p className="mt-1 text-sm text-[var(--color-danger)]">{errors.name.message}</p>
            )}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={fieldClassName}
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-[var(--color-danger)]">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text)]">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            placeholder="Password"
            className={fieldClassName}
            {...register('password')}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-[var(--color-danger)]">{errors.password.message}</p>
          )}
        </div>

        {error && (
          <p className="text-center text-sm text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-md bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Loading...' : isSignUp ? t(locale, 'auth.signUp') : t(locale, 'auth.signIn')}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={onToggle}
            className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] hover:underline"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </form>
    </div>
  )
}
