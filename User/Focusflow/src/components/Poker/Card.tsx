"use client";

interface CardProps {
  value: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function Card({
  value,
  selected,
  onClick,
  disabled = false,
}: CardProps) {
  return (
    <div
      className={`aspect-[2/3] rounded-xl flex items-center justify-center text-2xl font-bold cursor-pointer transition-all duration-150 transform ${
        selected
          ? "bg-red-500 text-white scale-105 shadow-lg ring-2 ring-red-400"
          : disabled
          ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
          : "bg-gray-800 text-white hover:bg-gray-700 hover:scale-105 hover:shadow-md active:scale-95 active:bg-gray-600"
      }`}
      onClick={disabled ? undefined : onClick}
    >
      {value}
    </div>
  );
}

export default Card;
