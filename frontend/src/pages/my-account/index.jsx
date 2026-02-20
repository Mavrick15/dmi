import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Image from '../../components/AppImage';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/axios';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const MyAccount = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const avatarInputRef = useRef(null);

  const [profile, setProfile] = useState({
    nomComplet: '',
    telephone: '',
    adresse: '',
    photoProfil: '',
  });
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    if (user) {
      setProfile({
        nomComplet: user.nomComplet || '',
        telephone: user.telephone || '',
        adresse: user.adresse || '',
        photoProfil: user.photoProfil || '',
      });
    }
  }, [user]);

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    if (profileErrors[field]) setProfileErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handlePasswordChange = (field, value) => {
    setPassword((prev) => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) setPasswordErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateProfile = () => {
    const err = {};
    if (!profile.nomComplet?.trim()) err.nomComplet = 'Le nom est requis.';
    if (profile.nomComplet?.length < 2) err.nomComplet = 'Au moins 2 caractères.';
    setProfileErrors(err);
    return Object.keys(err).length === 0;
  };

  const validatePassword = () => {
    const err = {};
    if (!password.currentPassword) err.currentPassword = 'Mot de passe actuel requis.';
    if (!password.newPassword) err.newPassword = 'Nouveau mot de passe requis.';
    else if (password.newPassword.length < 8) err.newPassword = 'Au moins 8 caractères.';
    if (password.newPassword !== password.confirmPassword) err.confirmPassword = 'Les mots de passe ne correspondent pas.';
    setPasswordErrors(err);
    return Object.keys(err).length === 0;
  };

  const submitProfile = async (e) => {
    e?.preventDefault();
    if (!validateProfile()) return;
    setLoadingProfile(true);
    try {
      let res;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('nomComplet', profile.nomComplet.trim());
        formData.append('telephone', profile.telephone?.trim() || '');
        formData.append('adresse', profile.adresse?.trim() || '');
        formData.append('avatar', avatarFile);
        res = await api.patch('/auth/profile', formData);
      } else {
        res = await api.patch('/auth/profile', {
          nomComplet: profile.nomComplet.trim(),
          telephone: profile.telephone?.trim() || null,
          adresse: profile.adresse?.trim() || null,
          photoProfil: profile.photoProfil?.trim() || null,
        });
      }
      const newUser = res.data?.data?.user;
      if (newUser) {
        updateUser({ ...user, ...newUser });
        setProfile((p) => ({ ...p, photoProfil: newUser.photoProfil || '' }));
        setAvatarFile(null);
        if (avatarInputRef.current) avatarInputRef.current.value = '';
        showToast(res.data?.message || 'Profil mis à jour.', 'success');
      }
    } catch (err) {
      showToast(err.userMessage || 'Erreur lors de la mise à jour du profil.', 'error');
    } finally {
      setLoadingProfile(false);
    }
  };

  const submitPassword = async (e) => {
    e?.preventDefault();
    if (!validatePassword()) return;
    setLoadingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });
      showToast('Mot de passe modifié avec succès.', 'success');
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    } catch (err) {
      showToast(err.userMessage || err.response?.data?.message || 'Erreur lors du changement de mot de passe.', 'error');
    } finally {
      setLoadingPassword(false);
    }
  };

  const userInitials = user?.nomComplet
    ? user.nomComplet.split(' ').map((n) => n?.[0]).filter(Boolean).join('').substring(0, 2).toUpperCase()
    : 'U';

  const roleLabels = { admin: 'Administrateur', docteur_clinique: 'Médecine générale', docteur_labo: 'Médecin biologiste', infirmiere: 'Infirmier(ère)', pharmacien: 'Pharmacien', gestionnaire: 'Gestionnaire', patient: 'Patient' };
  const roleLabel = user?.role ? (roleLabels[user.role] || user.role) : '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <Helmet>
        <title>Mon compte | MediCore</title>
        <meta name="description" content="Gérer votre profil et votre mot de passe." />
      </Helmet>
      <Header />

      <main className="pt-24 w-full max-w-3xl mx-auto px-6 lg:px-8 pb-16">
        {/* En-tête avec carte profil résumée */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="h-16 bg-primary/10 dark:bg-primary/20" />
            <div className="px-6 pb-6 -mt-8 relative">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center overflow-hidden flex-shrink-0">
                  {avatarFile ? (
                    <img src={URL.createObjectURL(avatarFile)} alt="" className="w-full h-full object-cover" />
                  ) : profile.photoProfil ? (
                    <Image src={profile.photoProfil} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-primary dark:text-blue-400">{userInitials}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                    {user?.nomComplet || 'Mon compte'}
                  </h1>
                  {roleLabel && (
                    <span className="inline-block mt-2 px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                      {roleLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Onglets et contenu */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
        >
          <div className="flex p-1.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'profile' ? 'bg-white dark:bg-slate-800 text-primary dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            >
              <Icon name="User" size={18} />
              Profil
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'password' ? 'bg-white dark:bg-slate-800 text-primary dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            >
              <Icon name="Lock" size={18} />
              Mot de passe
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {activeTab === 'profile' && (
              <form onSubmit={submitProfile} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-1">
                  <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Icon name="User" size={16} />
                      Identité
                    </h2>
                    <Input
                      label="Nom complet"
                      value={profile.nomComplet}
                      onChange={(e) => handleProfileChange('nomComplet', e.target.value)}
                      error={profileErrors.nomComplet}
                      placeholder="Votre nom"
                    />
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                      <Icon name="Phone" size={16} />
                      Contact
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Téléphone"
                        value={profile.telephone}
                        onChange={(e) => handleProfileChange('telephone', e.target.value)}
                        error={profileErrors.telephone}
                        placeholder="Optionnel"
                      />
                      <Input
                        label="Adresse"
                        value={profile.adresse}
                        onChange={(e) => handleProfileChange('adresse', e.target.value)}
                        error={profileErrors.adresse}
                        placeholder="Optionnel"
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                      <Icon name="Image" size={16} />
                      Photo
                    </h2>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept={ACCEPTED_IMAGE_TYPES.join(',')}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && ACCEPTED_IMAGE_TYPES.includes(file.type)) {
                            setAvatarFile(file);
                          } else if (file) {
                            showToast('Format accepté : JPG, PNG, GIF ou WebP.', 'error');
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        iconName="Upload"
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        Choisir une photo
                      </Button>
                      {avatarFile && (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {avatarFile.name} — enregistrée à l’envoi
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={loadingProfile} iconName="Save" size="lg">
                    Enregistrer les modifications
                  </Button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={submitPassword} className="space-y-6 max-w-2xl">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 mb-6">
                  <Icon name="ShieldAlert" size={22} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Changer votre mot de passe régulièrement améliore la sécurité de votre compte.
                  </p>
                </div>
                <Input
                  label="Mot de passe actuel"
                  type="password"
                  value={password.currentPassword}
                  onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                  error={passwordErrors.currentPassword}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nouveau"
                    type="password"
                    value={password.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    error={passwordErrors.newPassword}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                  <Input
                    label="Confirmer"
                    type="password"
                    value={password.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    error={passwordErrors.confirmPassword}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Minimum 8 caractères.
                </p>
                <div className="flex justify-end pt-2">
                  <Button type="submit" loading={loadingPassword} iconName="Lock" size="lg">
                    Changer le mot de passe
                  </Button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default MyAccount;
