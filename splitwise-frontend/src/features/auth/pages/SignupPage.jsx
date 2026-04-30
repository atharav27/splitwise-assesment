import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { FormInputField } from '../../../components/form-fields';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/card';
import { Form } from '../../../components/ui/form';
import { useAuth } from '../../../context/AuthContext';

const signupSchema = z
  .object({
    name: z.string().min(1, 'Full name is required'),
    email: z.string().min(1, 'Email or ID is required'),
    password: z.string().min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const getPasswordScore = (password = '') => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
};

const PasswordStrengthBar = ({ password }) => {
  const score = getPasswordScore(password);
  const barClass = [
    'bg-destructive',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-emerald-500',
  ];

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-4 gap-1">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`h-1.5 rounded-full ${idx < score ? barClass[Math.max(score - 1, 0)] : 'bg-muted'}`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Use 8+ chars with uppercase, number, and special character.
      </p>
    </div>
  );
};

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [apiError, setApiError] = useState('');

  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = form.watch('password');
  const { isSubmitting } = form.formState;

  const onSubmit = async (values) => {
    setApiError('');
    try {
      await signup({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      navigate('/');
    } catch (error) {
      if (error?.response?.status === 409) {
        setApiError('This email is already registered');
        return;
      }
      setApiError('Unable to create account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader className="space-y-2 text-center">
          <p className="text-xl font-semibold tracking-tight">splitwise</p>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Start splitting expenses with friends</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormInputField
                control={form.control}
                name="name"
                label="Full Name"
                placeholder="Alex Johnson"
                disabled={isSubmitting}
              />
              <FormInputField
                control={form.control}
                name="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                disabled={isSubmitting}
              />
              <FormInputField
                control={form.control}
                name="password"
                label="Password"
                type="password"
                showToggle
                placeholder="Create a password"
                disabled={isSubmitting}
              />
              <PasswordStrengthBar password={password} />
              <FormInputField
                control={form.control}
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                showToggle
                placeholder="Confirm your password"
                disabled={isSubmitting}
              />

              {apiError ? (
                <Alert variant="destructive">
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <LoadingSpinner size="sm" className="min-h-0" />
                    Creating account...
                  </span>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>
          </Form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in →
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;
