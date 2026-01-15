import React from 'react';
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-tr from-[#ecf0f3] to-[#dbeafe] flex items-center justify-center px-4">
      <div className="bg-white/60 backdrop-blur-md shadow-2xl border border-white/20 rounded-3xl p-10 max-w-4xl w-full space-y-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center text-blue-800">
          Speak • Write • Improve
        </h1>
        <p className="text-center text-gray-700 text-lg max-w-2xl mx-auto">
          Practice English with real-time feedback. Enhance fluency, grammar, confidence — one step at a time.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            {
              icon: "🎤",
              label: "Speak on Topic",
              path: "/speak",
              desc: "Talk about selected topics with live grammar feedback.",
            },
            {
              icon: "✍️",
              label: "Write Something",
              path: "/write",
              desc: "Write essays or stories and get corrections instantly.",
            },
            {
              icon: "📸",
              label: "Picture Description",
              path: "/describe",
              desc: "Speak or write based on images to build creativity.",
            },
          ].map((item, index) => (
            <Link
              to={item.path}
              key={index}
              className="bg-white p-5 rounded-xl shadow-md hover:shadow-xl transition duration-300 flex flex-col gap-2 hover:scale-105"
            >
              <div className="text-4xl">{item.icon}</div>
              <h2 className="text-lg font-bold text-gray-800">{item.label}</h2>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </Link>
          ))}
        </div>

        <div className="flex justify-center pt-6">
          <Link
            to="/dashboard"
            className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-xl shadow-md text-lg font-semibold transition"
          >
            Go to Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
