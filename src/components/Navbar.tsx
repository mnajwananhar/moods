"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Utensils,
  Users,
  BookOpen,
  History,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsUserMenuOpen(false);
    };

    if (isUserMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const navigation = [
    { name: "Beranda", href: "/", icon: Brain },
    {
      name: "Analisis Nutrisi",
      href: "/recommendations/assessment",
      icon: Utensils,
    },
    { name: "Komunitas", href: "/community", icon: Users },
    { name: "Edukasi", href: "/learn", icon: BookOpen },
  ];

  const userNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    { name: "Riwayat", href: "/history", icon: History },
    { name: "Profil", href: "/profile", icon: User },
    { name: "Pengaturan", href: "/profile/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-sage-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-r from-forest-600 to-forest-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-forest-900 group-hover:text-forest-700 transition-colors">
              NutriMood
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-forest-100 text-forest-700 shadow-sm"
                      : "text-sage-700 hover:text-forest-700 hover:bg-sage-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-sage-200 animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-sage-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-forest-500 to-forest-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user.user_metadata?.full_name?.[0]?.toUpperCase() ||
                      user.email?.[0]?.toUpperCase() ||
                      "U"}
                  </div>
                  <span className="text-sage-700 font-medium">
                    {user.user_metadata?.full_name || "User"}
                  </span>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-earth border border-sage-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-sage-100">
                      <p className="text-sm font-medium text-forest-900">
                        {user.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-sm text-sage-600">{user.email}</p>
                    </div>

                    {userNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-sage-700 hover:bg-sage-50 hover:text-forest-700 transition-colors"
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}

                    <div className="border-t border-sage-100 mt-2 pt-2">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Keluar</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="text-sage-700 hover:text-forest-700 font-medium transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-gradient-to-r from-forest-600 to-forest-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  Daftar Gratis
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-sage-600 hover:text-forest-700 hover:bg-sage-50 transition-colors"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-sage-200 shadow-lg">
          <div className="px-4 py-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-forest-100 text-forest-700"
                      : "text-sage-700 hover:text-forest-700 hover:bg-sage-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {user && (
              <>
                <div className="border-t border-sage-200 mt-4 pt-4">
                  {userNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center space-x-3 px-3 py-3 rounded-lg text-base font-medium text-sage-700 hover:text-forest-700 hover:bg-sage-50 transition-colors"
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="border-t border-sage-200 mt-4 pt-4">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Keluar</span>
                  </button>
                </div>
              </>
            )}

            {!user && !loading && (
              <div className="border-t border-sage-200 mt-4 pt-4 space-y-2">
                <Link
                  href="/auth/login"
                  className="block w-full text-center px-4 py-3 text-sage-700 hover:text-forest-700 font-medium transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/signup"
                  className="block w-full text-center bg-gradient-to-r from-forest-600 to-forest-700 text-white px-4 py-3 rounded-lg font-medium shadow-sm"
                >
                  Daftar Gratis
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
