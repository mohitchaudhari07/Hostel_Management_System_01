import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Menu, X, User, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { logoutUser, getCurrentUser } from "../../utils/authUtils";

export default function DashboardLayout({
  children,
  menuItems = [],
  activeMenu,
  setActiveMenu,
  user: propUser,
  title = "HostelSync",
}) {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const user = propUser || getCurrentUser();

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;

      setIsDesktop(desktop);
      setIsSidebarOpen(desktop);
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logoutUser();
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {!isDesktop && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* MAIN LAYOUT */}
      <div
        className={cn(
          "h-full w-full",
          isDesktop ? "grid grid-cols-[320px_1fr]" : "flex relative",
        )}
      >
        {/* SIDEBAR */}
        <motion.aside
          initial={false}
          animate={
            !isDesktop
              ? {
                  x: isSidebarOpen ? 0 : -320,
                }
              : {}
          }
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 25,
          }}
          className={cn(
            "z-50 flex flex-col overflow-hidden",
            "bg-white/80 backdrop-blur-2xl",
            "border-r border-white/30",
            "shadow-[0_8px_32px_rgba(15,23,42,0.08)]",
            "w-[320px]",

            !isDesktop && "fixed inset-y-0 left-0",

            isDesktop && "relative h-full",
          )}
        >
          {/* TOP GLOW */}
          <div className="absolute top-0 right-0 h-72 w-72 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

          {/* HEADER */}
          <div className="relative flex items-center justify-between px-6 h-24 border-b border-slate-200/60">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-4"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-30 rounded-full" />

                <img
                  className="relative w-16 drop-shadow-md"
                  src="https://res.cloudinary.com/dqgfgmkkc/image/upload/v1778815679/hostelsync.png"
                  alt="HostelSync"
                />
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">
                  {title}
                </h1>

                <p className="text-xs text-slate-500 font-medium tracking-wide">
                  Smart Hostel Management
                </p>
              </div>
            </motion.div>

            {/* MOBILE CLOSE */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition"
            >
              <X size={22} />
            </button>
          </div>

          {/* NAVIGATION */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto hide-scrollbar">
            <div className="space-y-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.id;

                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{
                      x: 6,
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveMenu(item.id);

                      if (!isDesktop) {
                        setIsSidebarOpen(false);
                      }
                    }}
                    className={cn(
                      "group relative w-full overflow-hidden",
                      "flex items-center gap-4",
                      "px-4 py-4 rounded-2xl",
                      "transition-all duration-300",
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
                        : "text-slate-600 hover:bg-white hover:shadow-md",
                    )}
                  >
                    {/* ACTIVE GLOW */}
                    {isActive && (
                      <>
                        <motion.div
                          layoutId="activeSidebarGlow"
                          className="absolute inset-0 bg-white/10"
                        />

                        <motion.div
                          layoutId="activeSidebarIndicator"
                          className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-white"
                        />
                      </>
                    )}

                    {/* ICON */}
                    <div
                      className={cn(
                        "relative flex items-center justify-center",
                        "w-11 h-11 rounded-xl",
                        "transition-all duration-300",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600",
                      )}
                    >
                      <Icon size={20} />
                    </div>

                    {/* LABEL */}
                    <div className="flex-1 text-left">
                      <p
                        className={cn(
                          "font-semibold",
                          isActive ? "text-white" : "text-slate-700",
                        )}
                      >
                        {item.label}
                      </p>
                    </div>

                    {/* BADGE */}
                    {item.badge && (
                      <div className="px-2 py-1 text-xs font-bold rounded-full bg-red-500 text-white">
                        {item.badge}
                      </div>
                    )}

                    {/* ARROW */}
                    <ChevronRight
                      size={18}
                      className={cn(
                        "transition-all duration-300",
                        isActive
                          ? "text-white opacity-100"
                          : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0",
                      )}
                    />
                  </motion.button>
                );
              })}
            </div>
          </nav>

          {/* FOOTER */}
          <div className="p-5 border-t border-slate-200/70">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLogout}
              className="flex items-center justify-center gap-3 w-full px-5 py-4 rounded-2xl font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-all duration-300 shadow-sm"
            >
              <LogOut size={18} />
              Logout
            </motion.button>
          </div>
        </motion.aside>

        {/* MAIN CONTENT */}
        <div className="flex flex-col h-full overflow-hidden min-w-0">
          {/* HEADER */}
          <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm">
            {/* MOBILE MENU */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl lg:hidden hover:bg-slate-100 transition"
            >
              <Menu size={24} />
            </button>

            {/* WELCOME */}
            <div className="hidden lg:block">
              <h1 className="text-2xl font-bold text-slate-800">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  {user?.name?.split(" ")[0]}
                </span>
                👋
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Manage your hostel smarter & faster
              </p>
            </div>

            {/* PROFILE */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-3 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || <User size={16} />}
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-700">
                  {user?.name || "User"}
                </p>

                <p className="text-xs text-slate-400 capitalize">
                  {user?.role?.replace(/_/g, " ") || "User"}
                </p>
              </div>
            </motion.div>
          </header>

          {/* PAGE CONTENT */}
          <div className="flex-1 overflow-y-auto hide-scrollbar p-4 sm:p-6 lg:p-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-7xl mx-auto"
            >
              {children}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { LogOut, Menu, X, User } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { cn } from "../../lib/utils";

// export default function DashboardLayout({
//   children,
//   menuItems = [],
//   activeMenu,
//   setActiveMenu,
//   user,
//   title = "HostelSync",
// }) {
//   const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

//   const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

//   const navigate = useNavigate();

//   // Responsive Handler
//   useEffect(() => {
//     const handleResize = () => {
//       const desktop = window.innerWidth >= 1024;

//       setIsDesktop(desktop);
//       setIsSidebarOpen(desktop);
//     };

//     handleResize();

//     window.addEventListener("resize", handleResize);

//     return () => {
//       window.removeEventListener("resize", handleResize);
//     };
//   }, []);

//   const handleLogout = () => {
//     localStorage.removeItem("user");
//     navigate("/");
//   };

//   return (
//     <div className="h-screen w-full  bg-slate-50">
//       {/* Mobile Overlay */}
//       <AnimatePresence>
//         {!isDesktop && isSidebarOpen && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={() => setIsSidebarOpen(false)}
//             className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
//           />
//         )}
//       </AnimatePresence>

//       {/* Main Layout */}
//       <div
//         className={cn(
//           "h-full w-full",
//           isDesktop ? "grid grid-cols-[300px_1fr]" : "flex relative",
//         )}
//       >
//         {/* Sidebar */}
//         <motion.aside
//           initial={false}
//           animate={
//             !isDesktop
//               ? {
//                   x: isSidebarOpen ? 0 : -300,
//                 }
//               : {}
//           }
//           transition={{ type: "spring", damping: 22 }}
//           className={cn(
//             "z-50 flex flex-col bg-white border-r border-slate-200",

//             // Width
//             "w-[300px]",

//             // Mobile
//             !isDesktop && "fixed inset-y-0 left-0 shadow-xl",

//             // Desktop
//             isDesktop && "relative h-full",
//           )}
//         >
//           {/* Sidebar Header */}
//           <div className="flex items-center justify-between h-20 px-6 border-b border-slate-100">
//             <div className="flex items-center gap-3">
//               {/* <div className="flex items-center justify-center w-10 h-10 text-white rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
//                 <span className="flex items-center justify-center">
//                   <img src="https://res.cloudinary.com/dqgfgmkkc/image/upload/v1778815115/l8j2qh7yxxqddq4eie9a.png" alt="HostelSync" />
//                 </span>
//               </div> */}
//               <img
//                 className="w-15"
//                 src="https://res.cloudinary.com/dqgfgmkkc/image/upload/v1778815679/hostelsync.png"
//                 alt="HostelSync"
//               />

//               <span className="text-2xl font-bold text-slate-800">{title}</span>
//             </div>

//             {/* Mobile Close */}
//             <button
//               onClick={() => setIsSidebarOpen(false)}
//               className="p-2 rounded-lg lg:hidden hover:bg-slate-100"
//             >
//               <X size={20} />
//             </button>
//           </div>

//           {/* Navigation */}
//           <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
//             {menuItems.map((item) => {
//               const Icon = item.icon;
//               const isActive = activeMenu === item.id;

//               return (
//                 <button
//                   key={item.id}
//                   onClick={() => {
//                     setActiveMenu(item.id);

//                     if (!isDesktop) {
//                       setIsSidebarOpen(false);
//                     }
//                   }}
//                   className={cn(
//                     "relative flex items-center w-full gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
//                     isActive
//                       ? "bg-blue-50 text-blue-700 font-semibold"
//                       : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
//                   )}
//                 >
//                   {/* Active Indicator */}
//                   {isActive && (
//                     <motion.div
//                       layoutId="activeIndicator"
//                       className="absolute left-0 w-1 h-8 bg-blue-600 rounded-r-full"
//                     />
//                   )}

//                   {/* Icon */}
//                   <div
//                     className={cn(
//                       "p-2 rounded-lg",
//                       isActive ? "bg-blue-100 text-blue-600" : "text-slate-400",
//                     )}
//                   >
//                     <Icon size={18} />
//                   </div>

//                   {/* Label */}
//                   <span>{item.label}</span>
//                 </button>
//               );
//             })}
//           </nav>

//           {/* Logout */}
//           <div className="p-4 border-t border-slate-100">
//             <button
//               onClick={handleLogout}
//               className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100"
//             >
//               <LogOut size={18} />
//               Logout
//             </button>
//           </div>
//         </motion.aside>

//         {/* Main Content */}
//         <div className="flex flex-col h-full overflow-hidden bg-slate-50 min-w-0">
//           {/* Header */}
//           <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 bg-white border-b border-slate-200">
//             {/* Mobile Menu */}
//             <button
//               onClick={() => setIsSidebarOpen(true)}
//               className="p-2 rounded-lg lg:hidden hover:bg-slate-100"
//             >
//               <Menu size={24} />
//             </button>

//             {/* Welcome */}
//             <div className="hidden lg:block">
//               <h1 className="text-xl font-semibold text-slate-800">
//                 Welcome back, {user?.name?.split(" ")[0]} 👋
//               </h1>
//             </div>

//             {/* User Profile */}
//             <div className="flex items-center gap-3 ml-auto">
//               <div className="flex items-center gap-3 px-4 py-2 bg-white border rounded-full shadow-sm border-slate-200">
//                 <div className="flex items-center justify-center w-8 h-8 font-semibold text-blue-700 bg-blue-100 rounded-full">
//                   {user?.name?.charAt(0)?.toUpperCase() || <User size={16} />}
//                 </div>

//                 <span className="hidden sm:block text-sm font-medium text-slate-700">
//                   {user?.name || "User"}
//                 </span>
//               </div>
//             </div>
//           </header>

//           {/* Page Content */}
//           <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
//             <motion.div
//               initial={{ opacity: 0, y: 8 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.3 }}
//               className="max-w-7xl mx-auto"
//             >
//               {children}
//             </motion.div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
