import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PANEL_ROUTES } from '../constants.js';

const { useState } = React;

const guideList = [
  {
    video: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    title: "Unified AI Search",
    description: "Get answers from multiple AI search engines at once to find the best results.",
  },
  {
    video: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    title: "Context-Aware Chat",
    description: "Quote text or upload files to have richer, more accurate conversations with AI.",
  },
  {
    video: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    title: "Custom Quick Actions",
    description: "Create your own one-click prompts to automate your most common tasks.",
  },
];

const Greeting = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const handleClick = () => {
    if (step < guideList.length - 1) {
      setStep(step + 1);
    } else {
      navigate(PANEL_ROUTES.SEARCH);
    }
  };

  const currentGuide = guideList[step];

  return (
    React.createElement('div', { className: "h-screen w-full bg-gray-900 flex flex-col items-center justify-center p-4 sm:p-8 text-white font-sans overflow-hidden" },
      React.createElement('div', { className: "text-center mb-8" },
        React.createElement('h1', { className: "text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500" },
          "Welcome to AI Sidekick"
        ),
        React.createElement('p', { className: "text-gray-400 mt-2 text-lg" }, "Your all-in-one AI work assistant.")
      ),
      React.createElement('div', { className: "w-full max-w-lg bg-gray-800/50 rounded-2xl shadow-2xl p-6 border border-gray-700 backdrop-blur-lg" },
        React.createElement('div', { className: "aspect-video w-full rounded-lg overflow-hidden mb-4 border border-gray-600" },
          React.createElement('video', {
            key: currentGuide.video,
            className: "w-full h-full object-cover",
            autoPlay: true,
            loop: true,
            muted: true,
            playsInline: true,
            src: currentGuide.video
          })
        ),
        React.createElement('h2', { className: "text-2xl font-semibold text-center text-gray-100" }, currentGuide.title),
        React.createElement('p', { className: "text-gray-400 text-center mt-2 mb-6" }, currentGuide.description),
        React.createElement('div', { className: "flex items-center justify-center gap-3 mb-6" },
          guideList.map((_, index) => (
            React.createElement('div', {
              key: index,
              className: `w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                step === index ? 'bg-blue-500 scale-125' : 'bg-gray-600'
              }`
            })
          ))
        ),
        React.createElement('button', {
          onClick: handleClick,
          className: "w-full text-lg font-semibold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out bg-blue-600 hover:bg-blue-500 text-white shadow-lg hover:shadow-blue-500/50 transform hover:-translate-y-0.5"
        },
          step < guideList.length - 1 ? 'Next' : 'Get Started'
        )
      )
    )
  );
};

export default Greeting;