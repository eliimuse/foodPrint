import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Leaf,
  LogIn,
  UserPlus,
  Lock,
  Mail,
  User,
  Building,
  DoorClosed,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { user, profile, role, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Intended destination prior to auth intercept
  const fromDestination = (location.state as any)?.from || null;

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form Fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [hostelBlock, setHostelBlock] = useState<string>('Godavari Hostel');
  const [roomNo, setRoomNo] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('hosteler');

  // Error & Status feedback
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [generalSuccess, setGeneralSuccess] = useState<string | null>(null);

  // Auto-redirect if already logged in and session is resolved
  useEffect(() => {
    if (!loading && user) {
      if (fromDestination && fromDestination !== '/auth' && fromDestination !== '/') {
        navigate(fromDestination, { replace: true });
      } else {
        const target = role === 'mess_manager' ? '/dashboard' : '/home';
        navigate(target, { replace: true });
      }
    }
  }, [user, loading, role, fromDestination, navigate]);

  // Navigate after successful sign-in
  const navigateAfterAuth = (resolvedRole: UserRole | null) => {
    if (fromDestination && fromDestination !== '/auth' && fromDestination !== '/') {
      navigate(fromDestination, { replace: true });
    } else if (resolvedRole === 'mess_manager') {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/home', { replace: true });
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        errors.fullName = 'Full name is required';
      } else if (fullName.trim().length < 2) {
        errors.fullName = 'Name must be at least 2 characters';
      }

      if (!hostelBlock.trim()) {
        errors.hostelBlock = 'Hostel block is required';
      }

      if (!roomNo.trim()) {
        errors.roomNo = 'Room number is required';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Format Supabase Error Messages into friendly copy
  const formatAuthError = (err: any): string => {
    const msg = err?.message || '';
    if (msg.includes('Invalid login credentials')) {
      return 'Incorrect email or password. Please verify and try again.';
    }
    if (msg.includes('User already registered')) {
      return 'An account with this email already exists. Try signing in instead.';
    }
    if (msg.includes('Email not confirmed')) {
      return 'Please verify your email address to log in, or contact your administrator.';
    }
    if (msg.includes('Password should be at least 6 characters')) {
      return 'Password must contain at least 6 characters.';
    }
    if (msg.includes('email rate limit') || msg.includes('over_email_send_rate_limit')) {
      return 'Supabase email rate limit reached. Please wait a few minutes, or toggle OFF "Confirm email" in your Supabase Dashboard (Authentication → Providers → Email) for instant signups.';
    }
    if (msg.includes('rate limit')) {
      return mode === 'signup'
        ? 'Too many signup attempts. Please wait a few minutes or disable "Confirm email" in your Supabase project settings.'
        : 'Too many login attempts. Please wait a minute and try again.';
    }
    return msg || 'Authentication error. Please check your connection and try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setGeneralSuccess(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    if (mode === 'signin') {
      const res = await signIn(email, password);
      setSubmitting(false);

      if (res.error) {
        setGeneralError(formatAuthError(res.error));
        return;
      }

      const activeRole = res.profile?.role || (res.user?.user_metadata?.role as UserRole) || 'hosteler';
      navigateAfterAuth(activeRole);
    } else {
      // Sign Up
      const res = await signUp(email, password, {
        full_name: fullName,
        hostel_block: hostelBlock,
        room_no: roomNo,
        role: selectedRole,
      });
      setSubmitting(false);

      if (res.error) {
        setGeneralError(formatAuthError(res.error));
        return;
      }

      // If session automatically started (email confirmation disabled in Supabase)
      if (res.user) {
        setGeneralSuccess('Account created successfully! Redirecting...');
        const activeRole = res.profile?.role || selectedRole;
        setTimeout(() => {
          navigateAfterAuth(activeRole);
        }, 600);
      } else {
        // Confirmation email sent
        setGeneralSuccess('Account created! Please check your email inbox to verify your account, then sign in.');
        setMode('signin');
      }
    }
  };

  // Preset demo account autofill helper
  const handleAutofillDemo = (demoType: 'hosteler' | 'manager') => {
    setGeneralError(null);
    setFieldErrors({});
    if (demoType === 'hosteler') {
      setEmail('aryan.sharma@hostel.edu');
      setPassword('Hostel123!');
      setFullName('Aryan Sharma');
      setHostelBlock('Godavari Hostel');
      setRoomNo('B-304');
      setSelectedRole('hosteler');
    } else {
      setEmail('k.raman@hostelmess.edu');
      setPassword('Manager123!');
      setFullName('Chef K. Raman');
      setHostelBlock('Central Dining Hall');
      setRoomNo('Mess Office');
      setSelectedRole('mess_manager');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden transition-all">
        {/* Header */}
        <div className="p-6 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-orange-600/20">
            <Leaf className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {mode === 'signin' ? 'Sign In to FoodPrint' : 'Create Hostel Account'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Zero-Waste Hostel Mess Management
          </p>

          {/* Destination notice if redirected via Auth Gate */}
          {fromDestination && (
            <div className="mt-3 py-1.5 px-3 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 text-[11px] text-orange-700 dark:text-orange-300 font-medium inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Sign in to continue to <strong className="font-mono">{fromDestination}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold bg-slate-100/50 dark:bg-slate-800/20">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setGeneralError(null);
              setFieldErrors({});
            }}
            className={`flex-1 py-3 text-center transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-white dark:bg-slate-900 border-b-2 border-orange-600 text-orange-600 dark:text-orange-400 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setGeneralError(null);
              setFieldErrors({});
            }}
            className={`flex-1 py-3 text-center transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-white dark:bg-slate-900 border-b-2 border-orange-600 text-orange-600 dark:text-orange-400 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </span>
          </button>
        </div>

        {/* Status Banners */}
        {generalError && (
          <div className="mx-6 mt-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        {generalSuccess && (
          <div className="mx-6 mt-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{generalSuccess}</span>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs" noValidate>
          {/* Sign Up Specific Fields */}
          {mode === 'signup' && (
            <>
              {/* Full Name */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aryan Sharma"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: '' }));
                    }}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border ${
                      fieldErrors.fullName
                        ? 'border-red-400 dark:border-red-600 bg-red-50/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60'
                    } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30`}
                  />
                </div>
                {fieldErrors.fullName && (
                  <p className="text-[11px] text-red-500 mt-1">{fieldErrors.fullName}</p>
                )}
              </div>

              {/* Hostel Block and Room Number in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Hostel Block <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="Godavari Hostel"
                      value={hostelBlock}
                      onChange={(e) => {
                        setHostelBlock(e.target.value);
                        if (fieldErrors.hostelBlock) setFieldErrors((p) => ({ ...p, hostelBlock: '' }));
                      }}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border ${
                        fieldErrors.hostelBlock
                          ? 'border-red-400 dark:border-red-600 bg-red-50/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60'
                      } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30`}
                    />
                  </div>
                  {fieldErrors.hostelBlock && (
                    <p className="text-[11px] text-red-500 mt-1">{fieldErrors.hostelBlock}</p>
                  )}
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Room No <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DoorClosed className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="B-304"
                      value={roomNo}
                      onChange={(e) => {
                        setRoomNo(e.target.value);
                        if (fieldErrors.roomNo) setFieldErrors((p) => ({ ...p, roomNo: '' }));
                      }}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border ${
                        fieldErrors.roomNo
                          ? 'border-red-400 dark:border-red-600 bg-red-50/20'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60'
                      } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30`}
                    />
                  </div>
                  {fieldErrors.roomNo && (
                    <p className="text-[11px] text-red-500 mt-1">{fieldErrors.roomNo}</p>
                  )}
                </div>
              </div>

              {/* Role Selection (Default is hosteler) */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Account Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('hosteler')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      selectedRole === 'hosteler'
                        ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 ring-2 ring-orange-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Hosteler (Student)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('mess_manager')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      selectedRole === 'mess_manager'
                        ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 ring-2 ring-orange-500/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    Mess Manager
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="aryan.sharma@hostel.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' }));
                }}
                className={`w-full pl-9 pr-3 py-2 rounded-xl border ${
                  fieldErrors.email
                    ? 'border-red-400 dark:border-red-600 bg-red-50/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60'
                } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-red-500 mt-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Password <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Min. 6 chars</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: '' }));
                }}
                className={`w-full pl-9 pr-9 py-2 rounded-xl border ${
                  fieldErrors.password
                    ? 'border-red-400 dark:border-red-600 bg-red-50/20'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60'
                } text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] text-red-500 mt-1">{fieldErrors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-60 transition-all shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
              </>
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In to Account' : 'Complete Registration'}</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Autofill section for review / rapid testing */}
        <div className="p-4 bg-slate-50/60 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Fast Test Autofill:</span>
            <span>Pre-fills form</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleAutofillDemo('hosteler')}
              className="py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-orange-500/60 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer text-center truncate"
            >
              Autofill Hosteler
            </button>
            <button
              type="button"
              onClick={() => handleAutofillDemo('manager')}
              className="py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-orange-500/60 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer text-center truncate"
            >
              Autofill Manager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
