import { useState, useRef } from "react";

export default function Tooltip({ term, definition }) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef(null);
  
  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Small delay to prevent accidental triggering
    timeoutRef.current = setTimeout(() => {
      setShow(true);
    }, 200);
  };
  
  const handleMouseLeave = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Small delay before hiding to allow moving to tooltip content
    timeoutRef.current = setTimeout(() => {
      setShow(false);
    }, 100);
  };
  
  const handleClick = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShow(!show);
  };
  
  return (
    <span className="relative group">
      <span
        className="underline text-blue-700 cursor-help"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {term}
      </span>
      {show && (
        <div 
          className="absolute z-10 bg-gray-100 border p-2 rounded w-64 text-sm mt-1 shadow"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {definition}
        </div>
      )}
    </span>
  );
}
