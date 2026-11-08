import React, { useState } from 'react';
import { X, Shield, UserCheck, LogIn, AlertCircle, GraduationCap, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { loginWithCredentials, registerUser } = useAuth();
  
  const [username, setUsername] = useState('Md Arifuzzaman Abir');
  const [email, setEmail] = useState('arifuzzamanabir2025@gmail.com');
  const [selectedRole, setSelectedRole] = useState<UserRole>('administrator');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionType, setActionType] = useState<'login' | 'register' | null>(null);

  if (!isOpen) return null;

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    setSuccess(null);
    // Provide smart defaults for fast testing while allowing manual custom input
    if (role === 'administrator') {
      setUsername('Md Arifuzzaman Abir');
      setEmail('arifuzzamanabir2025@gmail.com');
    } else if (role === 'controller') {
      setUsername('Tanvir Ahmed');
      setEmail('controller.tech@cityuniversity.edu');
    } else {
      setUsername('Nafis Fuad');
      setEmail('student@cityuniversity.edu');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      setError('Please provide both username and email address.');
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);
    setActionType('login');

    const res = await loginWithCredentials(username.trim(), email.trim(), selectedRole);
    setLoading(false);
    setActionType(null);

    if (res.success) {
      setSuccess(`Logged in successfully as ${selectedRole.toUpperCase()}!`);
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setError(res.message || 'Login failed. Please verify credentials.');
    }
  };

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !email.trim()) {
      setError('Please provide both username and email address.');
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);
    setActionType('register');

    const res = await registerUser({
      name: username.trim(),
      username: username.trim(),
      email: email.trim(),
      role: selectedRole
    });
    setLoading(false);
    setActionType(null);

    if (res.success) {
      setSuccess(`Account created & signed in as ${selectedRole.toUpperCase()}!`);
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setError(res.message || 'Account creation failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#151620] border border-neutral-200 dark:border-[#382026] rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with Official University Logo */}
        <div className="bg-gradient-to-r from-[#D40000] via-[#7A0000] to-[#550000] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors cursor-pointer"
            aria-label="Close authentication modal"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-14 h-14 rounded-full bg-white p-1 shadow-lg ring-2 ring-white/70 overflow-hidden flex items-center justify-center shrink-0">
              <img 
                src="/city-university-logo.jpg" 
                alt="City University Official Logo" 
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-200 block">
                City University
              </span>
              <span className="text-xs text-white/90 font-medium italic">
                ...creating a culture of excellence
              </span>
            </div>
          </div>

          <h3 className="text-xl font-bold font-heading">
            Login Page
          </h3>
        </div>

        {/* Form Body: Username, Email, 3 Role Buttons, and Login / Create Account Buttons */}
        <div className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLoginSubmit}>
            
            {/* 1. Username Field */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Username / Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Md Arifuzzaman Abir"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#11121A] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#D40000]"
              />
            </div>

            {/* 2. Email Field */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="name@cityuniversity.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#11121A] text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#D40000]"
              />
            </div>

            {/* 3. Role in Three Buttons */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Role (Select One) *
              </label>
              <div className="grid grid-cols-3 gap-2">
                
                {/* Role Button 1: User / Student */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('user')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                    selectedRole === 'user'
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-500 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/30 shadow-xs'
                      : 'bg-neutral-50 dark:bg-[#141520] border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                  }`}
                >
                  <GraduationCap className={`w-4 h-4 ${selectedRole === 'user' ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500'}`} />
                  <span className="text-[11px] font-bold block leading-tight">Student</span>
                  <span className="text-[9px] opacity-75 font-medium">User</span>
                </button>

                {/* Role Button 2: Controller */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('controller')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                    selectedRole === 'controller'
                      ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-500 text-amber-800 dark:text-amber-300 ring-2 ring-amber-500/30 shadow-xs'
                      : 'bg-neutral-50 dark:bg-[#141520] border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                  }`}
                >
                  <UserCheck className={`w-4 h-4 ${selectedRole === 'controller' ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-500'}`} />
                  <span className="text-[11px] font-bold block leading-tight">Controller</span>
                  <span className="text-[9px] opacity-75 font-medium">Wing Lead</span>
                </button>

                {/* Role Button 3: Administrator */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('administrator')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 ${
                    selectedRole === 'administrator'
                      ? 'bg-red-50 dark:bg-red-950/70 border-[#D40000] text-[#D40000] dark:text-red-300 ring-2 ring-red-500/30 shadow-xs'
                      : 'bg-neutral-50 dark:bg-[#141520] border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400'
                  }`}
                >
                  <Shield className={`w-4 h-4 ${selectedRole === 'administrator' ? 'text-[#D40000] dark:text-red-400' : 'text-neutral-500'}`} />
                  <span className="text-[11px] font-bold block leading-tight">Admin</span>
                  <span className="text-[9px] opacity-75 font-medium">Central</span>
                </button>

              </div>
            </div>

            {/* 4. Below: Two Buttons (Login and Create Account) */}
            <div className="pt-2 flex items-center gap-2.5">
              
              {/* Button 1: Login */}
              <button
                type="button"
                onClick={handleLoginSubmit}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl bg-[#D40000] hover:bg-[#A00000] active:scale-98 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading && actionType === 'login' ? 'Logging in...' : 'Login'}</span>
              </button>

              {/* Button 2: Create Account */}
              <button
                type="button"
                onClick={handleCreateAccountSubmit}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl bg-neutral-100 dark:bg-[#1C1D2B] hover:bg-neutral-200 dark:hover:bg-[#26283B] text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 active:scale-98 font-bold text-xs uppercase tracking-wider shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4 text-[#D40000] dark:text-red-400" />
                <span>{loading && actionType === 'register' ? 'Creating...' : 'Create Account'}</span>
              </button>

            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
