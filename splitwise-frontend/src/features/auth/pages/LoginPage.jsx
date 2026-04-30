import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { FormInputField } from '../../../components/form-fields';
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
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';
import { loginSchema } from '../../../schemas';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [apiError, setApiError] = useState('');

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    setApiError('');
    try {
      await login(values);
      navigate('/');
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        setApiError('Invalid email or password');
        return;
      }
      if (status === 429) {
        setApiError('Too many attempts. Try again in 15 minutes.');
        return;
      }
      setApiError('Unable to sign in. Please try again.');
    }
  };

  const { isSubmitting } = form.formState;
  const isAuthLoading = isSubmitting || loading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-[400px]">
        <CardHeader className="space-y-2 text-center">
          <p className="text-xl font-semibold tracking-tight">splitwise</p>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormInputField
                control={form.control}
                name="email"
                label="Email"
                type="email"
                placeholder="you@example.com"
                disabled={isAuthLoading}
              />
              <FormInputField
                control={form.control}
                name="password"
                label="Password"
                type="password"
                showToggle
                placeholder="Enter your password"
                disabled={isAuthLoading}
              />
              <div className="text-right">
                <span className="text-sm text-muted-foreground cursor-not-allowed">
                  Forgot password?
                </span>
              </div>

              {apiError ? (
                <Alert variant="destructive">
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" className="w-full" disabled={isAuthLoading}>
                {isAuthLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <LoadingSpinner size="sm" className="min-h-0" />
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline">
              Sign up →
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
