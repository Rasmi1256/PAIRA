import React, { useState } from "react";
import { useAuth } from "../context/useAuth";
import {
  FaHeart,
  FaUser,
  FaCalendarAlt,
  FaCog,
  FaImages,
  FaBars,
  FaSignOutAlt,
  FaComments,
  FaTachometerAlt,
  FaLink,
} from "react-icons/fa";

// Sidebar Views
import DashboardView from "../components/Sidebar/DashboardView";
import MessagesView from "../components/Sidebar/MessagesView";
import GalleryView from "../components/Sidebar/GalleryView";
import CalendarView from "../components/Sidebar/CalendarView";
import SettingsView from "../components/Sidebar/SettingsView";
import PairingView from "../components/Sidebar/PairingView";

type ViewType =
  | "Dashboard"
  | "Messages"
  | "Gallery"
  | "Calendar"
  | "Settings"
  | "Pairing";
type ThemeType = "default" | "sunset" | "ocean";

interface UserProfile {
  name: string;
  profilePictureUrl: string;
  anniversaryDate: string;
}

const DashboardPage: React.FC = () => {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<ViewType>("Dashboard");
  const [theme, setTheme] = useState<ThemeType>("default");
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Alex",
    profilePictureUrl: "https://via.placeholder.com/150", // Placeholder image
    anniversaryDate: "2020-10-25",
  });

  const themeClasses: Record<ThemeType, string> = {
    default: "animated-gradient",
    sunset: "bg-gradient-to-br from-red-500 via-yellow-500 to-pink-500",
    ocean: "bg-gradient-to-br from-blue-400 via-teal-400 to-green-400",
  };

  const viewConfig: Record<
    ViewType,
    { title: string; component: React.ReactNode }
  > = { 
    Dashboard: { title: "Dashboard", component: <DashboardView /> },
    Messages: { title: "Messages", component: <MessagesView /> },
    Gallery: { title: "Gallery", component: <GalleryView /> },
    Calendar: { title: "Calendar", component: <CalendarView /> },
    Settings: { title: "Settings", component: <SettingsView /> },
    Pairing: { title: "Pair with Partner", component: <PairingView /> },
  };

  return (
    <div className={`min-h-screen flex font-sans relative ${themeClasses[theme]}`}>

      {/* Frosted Glass Overlay */}
      <div className="absolute inset-0 backdrop-blur-sm bg-white/10 pointer-events-none"></div>

      {/* ======================== SIDEBAR ======================== */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64
          border-r border-white/20
          bg-white/20 backdrop-blur-2xl
          shadow-[0_8px_30px_rgb(0,0,0,0.12)]
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Sidebar Header */}
        <div className="px-6 py-5 border-b border-white/20 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent drop-shadow">
            MySpace
          </h2>

          <button
            className="lg:hidden text-gray-600 hover:text-gray-800 transition"
            onClick={() => setSidebarOpen(false)}
          >
            ✖
          </button>
        </div>

        {/* Menu Items */}
        <nav className="mt-6 space-y-2 px-4">
          <SidebarItem
            icon={<FaTachometerAlt />}
            label="Dashboard"
            active={activeView === "Dashboard"}
            onClick={() => setActiveView("Dashboard")}
          />

          <SidebarItem
            icon={<FaComments />}
            label="Messages"
            active={activeView === "Messages"}
            onClick={() => setActiveView("Messages")}
          />

          <SidebarItem
            icon={<FaImages />}
            label="Gallery"
            active={activeView === "Gallery"}
            onClick={() => setActiveView("Gallery")}
          />

          <SidebarItem
            icon={<FaCalendarAlt />}
            label="Calendar"
            active={activeView === "Calendar"}
            onClick={() => setActiveView("Calendar")}
          />

          {!loading && user && !user.partnerName && (
            <SidebarItem
              icon={<FaLink />}
              label="Pair with Partner"
              active={activeView === "Pairing"}
              onClick={() => setActiveView("Pairing")}
            />
          )}

          <SidebarItem
            icon={<FaCog />}
            label="Settings"
            active={activeView === "Settings"}
            onClick={() => setActiveView("Settings")}
          />

          {/* Logout */}
          <div className="pt-8">
            <SidebarItem icon={<FaSignOutAlt />} label="Logout" danger />
          </div>
        </nav>
      </aside>

      {/* ======================== MAIN CONTENT AREA ======================== */}
      <div className="flex-1 min-h-screen ml-0 lg:ml-64 transition-all duration-300 relative z-10">

        {/* ======================== NAVBAR ======================== */}
        <header
          className="
            bg-white/20 backdrop-blur-xl 
            border-b border-white/20 
            shadow-[0_4px_20px_rgba(0,0,0,0.1)]
          "
        >
          <div className="max-w-7xl mx-auto py-4 px-6 flex justify-between items-center">

            {/* Mobile Sidebar Button */}
            <button
              className="lg:hidden p-2 rounded-md text-gray-200 hover:bg-white/10 transition"
              onClick={() => setSidebarOpen(true)}
            >
              <FaBars size={22} />
            </button>

            {/* Page Title */}
            <h1 className="text-3xl font-bold text-white drop-shadow">
              {viewConfig[activeView].title}
            </h1>

            {/* Partner Info Section */}
            {user && user.partnerName && (
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2 border border-white/20">
                <div className="w-8 h-8 rounded-full bg-white/30 border border-white/40 shadow-md overflow-hidden">
                  <img
                    src={user.partnerProfilePictureUrl || "https://via.placeholder.com/32"}
                    alt="Partner Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-white text-sm">
                  <div className="font-semibold">{user.partnerName}</div>
                  <div className="text-white/80">{user.partnerEmail}</div>
                </div>
              </div>
            )}

            {/* Avatar + Settings */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-lg border border-white/40 shadow-md overflow-hidden">
                <img
                  src={userProfile.profilePictureUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>

              <button
                className="
                  p-2 rounded-full 
                  bg-white/20 backdrop-blur-lg 
                  border border-white/30 
                  text-white 
                  hover:bg-white/30 
                  transition
                "
              >
                <FaCog size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* ======================== MAIN BODY ======================== */}
        <main>
          <MainContent view={viewConfig[activeView].component} />
        </main>
      </div>
    </div>
  );
};

/* ======================== SIDEBAR ITEM COMPONENT ======================== */

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  active,
  danger,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer
        transition-all duration-300 text-sm font-medium
        
        ${
          active
            ? "bg-white/30 text-white shadow-lg backdrop-blur-xl border border-white/30"
            : "text-white/80 hover:bg-white/10 hover:text-white"
        }
        
        ${danger ? "text-red-300 hover:bg-red-500/20" : ""}
      `}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </div>
  );
};

/* ======================== MAIN CONTENT COMPONENT ======================== */

const MainContent: React.FC<{ view: React.ReactNode }> = ({ view }) => (
  <div className="max-w-7xl mx-auto py-6 px-6">
    <div className="px-2 py-6">
      {view}
    </div>
  </div>
);

export default DashboardPage;
