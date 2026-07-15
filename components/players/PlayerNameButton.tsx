"use client";

type PlayerNameButtonProps = {
  name: string;
  onClick: () => void;
  className?: string;
};

export function PlayerNameButton({
  name,
  onClick,
  className = "",
}: PlayerNameButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`truncate text-left font-black text-white transition hover:text-cyan-200 hover:underline hover:underline-offset-4 ${className}`}
    >
      {name}
    </button>
  );
}
