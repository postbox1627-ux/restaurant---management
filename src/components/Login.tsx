import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { UtensilsCrossed, Lock, User as UserIcon, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

const Login = () => {
  const { user, login, loading } = useAuth();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (loading) return null;
  if (user) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await login(employeeId, password);
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid Employee ID or Password.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Invalid Password. Default password is your Employee ID.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password authentication is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl backdrop-blur-lg bg-white/90 rounded-3xl overflow-hidden">
        <div className="bg-orange-600 p-8 flex flex-col items-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <UtensilsCrossed size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Savory</h1>
          <p className="text-orange-100 mt-2">Restaurant Management System</p>
        </div>
        <CardHeader className="pt-8 text-center">
          <CardTitle className="text-2xl text-stone-800">Staff Login</CardTitle>
          <CardDescription className="text-stone-500">
            Enter your Employee ID and Password to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8 px-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <Input 
                  id="employeeId"
                  placeholder="e.g. 2026MAN01" 
                  className="pl-10 rounded-xl border-stone-200 h-12 uppercase"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <Input 
                  id="password"
                  type="password"
                  placeholder="••••••••" 
                  className="pl-10 rounded-xl border-stone-200 h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-rose-500 font-medium text-center">{error}</p>
            )}

            {success && (
              <p className="text-sm text-emerald-500 font-medium text-center">{success}</p>
            )}

            <Button 
              type="submit"
              disabled={authLoading}
              className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-lg shadow-orange-100 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {authLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
