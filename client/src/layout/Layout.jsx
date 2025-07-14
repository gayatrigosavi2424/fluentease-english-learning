import React from 'react';import Navbar from "../components/Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 to-blue-100">
      <Navbar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
