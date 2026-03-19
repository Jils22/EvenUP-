import React from 'react';
import { useForm } from 'react-form'; // Note using standard react-hook-form
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { PrimaryButton } from '../components/ui/Button';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useRHForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      const response = await authApi.login(data);
      login(response.token, response.user);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20 text-2xl mb-6">
          E
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome back to EvenUP</h2>
        <p className="mt-2 text-sm text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-white transition-colors">
            Create an account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass py-8 px-4 shadow sm:rounded-[20px] sm:px-10 border border-border-soft">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            
            {error && (
              <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Email address</label>
              <input 
                {...register('email')}
                type="email" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Password</label>
              <input 
                {...register('password')}
                type="password" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-end">
              <a href="#" className="text-sm font-medium text-primary hover:text-white transition-colors">
                Forgot your password?
              </a>
            </div>

            <PrimaryButton className="w-full" type="submit" isLoading={isSubmitting}>
              Sign in
            </PrimaryButton>
            
          </form>
        </div>
      </div>
    </div>
  );
}
