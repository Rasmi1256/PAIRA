import React, { useState } from 'react';
import { EditProfileModal } from '../Sidebar/EditProfileModal';
import { 
  FaCog, 
  FaUserEdit, 
  FaCamera, 
  FaLink, 
  FaLock, 
  FaShieldAlt, 
  FaHistory, 
  FaMobileAlt, 
  FaChevronRight 
} from 'react-icons/fa';

/* --- Reusable Section Component --- */
const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-10">
        <h3 className="text-xl font-semibold text-gray-800 mb-5 pb-3 border-b border-gray-200">{title}</h3>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

/* --- Reusable Item Component --- */
interface SettingsItemProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick?: () => void;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, title, subtitle, onClick }) => (
    <div 
        onClick={onClick} 
        className="flex items-center bg-white/50 p-4 rounded-lg border border-transparent hover:border-gray-300 hover:bg-white/80 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
    >
        <div className="p-3 rounded-full bg-gray-100 text-gray-600 mr-4">
            {icon}
        </div>
        <div className="flex-grow">
            <h4 className="font-semibold text-gray-900">{title}</h4>
            <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <FaChevronRight className="text-gray-400" />
    </div>
);

const SettingsView: React.FC = () => {
  const [isEditProfileOpen, setEditProfileOpen] = useState(false);

  return (
    <>
      <div className="bg-white/80 backdrop-blur-2xl rounded-2xl shadow-xl p-8 border border-white/30">
        <div className="flex items-center mb-8">
          <FaCog className="text-3xl text-gray-600 mr-4" />
          <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
        </div>
  
        {/* --- Profile Management Section --- */}
        <SettingsSection title="Profile Management">
          <SettingsItem icon={<FaUserEdit />} title="Edit Profile" subtitle="Update your name, email, or phone number" onClick={() => setEditProfileOpen(true)} />
          <SettingsItem icon={<FaCamera />} title="Change Profile Picture" subtitle="Upload a new photo" />
          <SettingsItem icon={<FaLink />} title="Manage Linked Accounts" subtitle="Connect or disconnect your partner's account" />
        </SettingsSection>
  
        {/* --- Account Security Section --- */}
        <SettingsSection title="Account Security">
          <SettingsItem icon={<FaLock />} title="Change Password" subtitle="Set a new password for your account" />
          <SettingsItem icon={<FaShieldAlt />} title="Two-Factor Authentication" subtitle="Add an extra layer of security" />
          <SettingsItem icon={<FaHistory />} title="Login History" subtitle="View recent login activity" />
          <SettingsItem icon={<FaMobileAlt />} title="Device Management" subtitle="See and manage all logged-in devices" />
        </SettingsSection>
      </div>
      <EditProfileModal isOpen={isEditProfileOpen} onClose={() => setEditProfileOpen(false)} />
    </>
  );
};

export default SettingsView;