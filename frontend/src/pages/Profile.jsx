import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [msg, setMsg] = useState('');
  const [errorNotice, setErrorNotice] = useState('');

  useEffect(() => {
    if (user) {
      const names = (user.name || '').trim().split(/\s+/);
      setFirstName(names[0] || '');
      setLastName(names.slice(1).join(' ') || '');
      setEmail(user.email || '');

      // Load additional user-specific profile fields from sandbox localStorage
      const storedPhone = localStorage.getItem(`profile_phone_${user.id}`) || '';
      const storedGender = localStorage.getItem(`profile_gender_${user.id}`) || '';
      setPhone(storedPhone);
      setGender(storedGender);
    }
  }, [user]);

  const handleSaveChanges = (e) => {
    e.preventDefault();
    setErrorNotice('');
    setMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setErrorNotice('Passwords do not match. Please verify the entries.');
      return;
    }

    if (!firstName.trim()) {
      setErrorNotice('First Name cannot be blank.');
      return;
    }

    try {
      // 1. Build updated user object
      const updatedUser = {
        ...user,
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim()
      };

      // 2. Persist updated core user and ancillary state
      localStorage.setItem('attendix_user', JSON.stringify(updatedUser));
      localStorage.setItem(`profile_phone_${user.id}`, phone.trim());
      localStorage.setItem(`profile_gender_${user.id}`, gender);

      // 3. Show dynamic feedback
      setMsg('Profile details changed successfully! Reloading to sync headers...');
      setNewPassword('');
      setConfirmPassword('');

      // 4. Force global app sync so header and metadata reflect the new details
      setTimeout(() => {
        window.location.reload();
      }, 1200);

    } catch (err) {
      setErrorNotice('Failed to update details: ' + err.message);
    }
  };

  const username = `@${(firstName || user?.name || '').toLowerCase()}_${(lastName || 'user').toLowerCase()}`.replace(/\s+/g, '');

  return (
    <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-100 p-8 shadow-xs space-y-6">
      <h2 className="font-sans font-bold text-slate-800 text-xl text-center">Profile</h2>

      {/* LIGHT PURPLE IDENTITY BANNER */}
      <div className="bg-[#f7f4fc] rounded-xl p-3 sm:p-4 text-center space-y-1">
        <h3 className="font-sans font-bold text-slate-800 text-base leading-tight">
          {firstName && lastName ? `${firstName} ${lastName}` : user?.name}
        </h3>
        <p className="text-xs text-slate-500 font-semibold font-medium">
          {user?.role} — {username}
        </p>
        <p className="text-[11px] text-[#ab93d6] font-bold font-semibold uppercase tracking-wider mt-0.5">
          Brookfield
        </p>
      </div>

      <form onSubmit={handleSaveChanges} className="space-y-4">
        {/* FIRST NAME */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 block">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
            className="w-full border border-slate-200 outline-none rounded-xl px-4 py-2.5 text-xs text-slate-800 bg-white focus:bg-white transition-all font-sans font-semibold placeholder:text-slate-400 focus:border-[#ab93d6]"
            required
          />
        </div>

        {/* LAST NAME */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 block">Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
            className="w-full border border-slate-200 outline-none rounded-xl px-4 py-2.5 text-xs text-slate-800 bg-white focus:bg-white transition-all font-sans font-semibold placeholder:text-slate-400 focus:border-[#ab93d6]"
          />
        </div>

        {/* EMAIL */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full border border-slate-200 outline-none rounded-xl px-4 py-2.5 text-xs text-slate-800 bg-white focus:bg-white transition-all font-sans font-semibold placeholder:text-slate-400 focus:border-[#ab93d6]"
            required
          />
        </div>

        {/* PHONE */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 block">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone Number"
            className="w-full border border-slate-200 outline-none rounded-xl px-4 py-2.5 text-xs text-slate-800 bg-white focus:bg-white transition-all font-sans font-semibold placeholder:text-slate-400 focus:border-[#ab93d6]"
          />
        </div>

        {/* GENDER */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 block">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full border border-slate-200 outline-none rounded-xl px-4 py-2.5 text-xs text-slate-705 bg-white transition-all font-sans font-semibold focus:border-[#ab93d6] cursor-pointer"
          >
            <option value="">-- Select --</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <hr className="border-slate-100 my-4" />

        <div className="space-y-3">
          <h3 className="font-sans font-bold text-[#2c5270] text-sm">Change Password</h3>

          {/* NEW PASSWORD */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 block">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-slate-200 outline-none rounded-xl px-4 py-2.5 text-xs text-slate-800 bg-white focus:bg-white transition-all font-sans font-semibold focus:border-[#ab93d6]"
            />
            <p className="text-[10px] text-slate-400 font-semibold font-medium">Leave blank to keep current password.</p>
          </div>

          {/* CONFIRM NEW PASSWORD */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 block">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-slate-200 outline-none rounded-xl px-4 py-2.5 text-xs text-slate-800 bg-white focus:bg-white transition-all font-sans font-semibold focus:border-[#ab93d6]"
            />
          </div>
        </div>

        {/* SUCCESS/ERROR FEEDBACK */}
        {msg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold text-center rounded-xl transition-all">
            {msg}
          </div>
        )}
        {errorNotice && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-bold text-center rounded-xl transition-all">
            {errorNotice}
          </div>
        )}

        <button
          id="save-profile-btn"
          type="submit"
          className="w-full bg-[#ab93d6] hover:bg-[#9a7ecb] text-white rounded-xl text-xs font-bold py-3 transition-all cursor-pointer shadow-sm focus:outline-none"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
