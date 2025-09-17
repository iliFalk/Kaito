import React from 'react';

const TypingKeyboardIcon = ({ className }) => {
  return (
    React.createElement(React.Fragment, null,
      React.createElement('style', null, `
        @keyframes typing-key-press {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(0.5px); }
        }
        @keyframes typing-key-light {
          0%, 100% { fill: #9a9a9a; }
          50% { fill: #e5e5e5; }
        }
        
        .key-anim1 { 
          animation: typing-key-press 1.5s infinite ease-in-out, typing-key-light 1.5s infinite ease-in-out;
          animation-delay: 0s;
        }
        .key-anim2 { 
          animation: typing-key-press 1.5s infinite ease-in-out, typing-key-light 1.5s infinite ease-in-out;
          animation-delay: 0.3s;
        }
        .key-anim3 {
          animation: typing-key-press 1.5s infinite ease-in-out, typing-key-light 1.5s infinite ease-in-out;
          animation-delay: 0.6s;
        }
      `),
      React.createElement('svg',
        {
          className: className,
          viewBox: "0 0 24 24",
          fill: "none",
          xmlns: "http://www.w3.org/2000/svg"
        },
        React.createElement('rect', { x: "2", y: "5", width: "20", height: "14", rx: "2", fill: "#000000" }),
        
        // Row 1
        React.createElement('rect', { x: "3", y: "6", width: "3", height: "4", rx: "0.5", fill: "#9a9a9a" }),
        React.createElement('rect', { x: "6", y: "6", width: "3", height: "4", rx: "0.5", fill: "#9a9a9a" }),
        React.createElement('rect', { x: "9", y: "6", width: "3", height: "4", rx: "0.5", fill: "#9a9a9a", className: "key-anim1" }),
        React.createElement('rect', { x: "12", y: "6", width: "3", height: "4", rx: "0.5", fill: "#9a9a9a" }),
        React.createElement('rect', { x: "15", y: "6", width: "3", height: "4", rx: "0.5", fill: "#9a9a9a", className: "key-anim3" }),
        React.createElement('rect', { x: "18", y: "6", width: "3", height: "4", rx: "0.5", fill: "#9a9a9a" }),

        // Row 2
        React.createElement('rect', { x: "3", y: "10", width: "3", height: "4", rx: "0.5", fill: "#9a9a9a", className: "key-anim2" }),
        React.createElement('rect', { x: "6", y: "10", width: "3", height: "4", rx: "0.5", fill: "#9a9a9a" }),
        React.createElement('rect', { x: "9", y: "10", width: "3", height: "4", rx: "0.5", fill: "#9a9a9a" }),
        React.createElement('rect', { x: "12", y: "10", width: "3", height: "4", rx: "0.5", fill: "#9a9a9a", className: "key-anim1" }),
        React.createElement('rect', { x: "15", y: "10", width: "3", height: "4", rx: "0.5", fill: "#9a9a9a" }),
        React.createElement('rect', { x: "18", y: "10", width: "3", height: "4", rx: "0.5", fill: "#9a9a9a" }),

        // Row 3
        React.createElement('rect', { x: "3", y: "14", width: "3", height: "4", rx: "0.5", fill: "#9a9a9a" }),
        React.createElement('rect', { x: "6", y: "14", width: "3", height: "4", rx: "0.5", fill: "#9a9a9a", className: "key-anim3" }),
        React.createElement('rect', { x: "9", y: "14", width: "6", height: "4", rx: "0.5", fill: "#9a9a9a" }),
        React.createElement('rect', { x: "15", y: "14", width: "3", height: "4", rx: "0.5", fill: "#9a9a9a", className: "key-anim2" }),
        React.createElement('rect', { x: "18", y: "14", width: "3", height: "4", rx: "0.5", fill: "#9a9a9a" })
      )
    )
  );
};

export default TypingKeyboardIcon;