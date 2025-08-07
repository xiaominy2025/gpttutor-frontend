import { useState } from "react";

export default function Tooltip({ term, definition }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative group">
      <span
        className="underline text-blue-700 cursor-help"
        onClick={() => setShow(!show)}
      >
        {term}
      </span>
      {show && (
        <div className="absolute z-10 bg-gray-100 border p-2 rounded w-64 text-sm mt-1 shadow">
          {definition}
        </div>
      )}
    </span>
  );
}
