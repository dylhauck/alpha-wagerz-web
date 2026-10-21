import Image from "next/image";

function getNextSlateDate() {
  const tomorrow = new Date();

  tomorrow.setDate(tomorrow.getDate() + 1);

  return tomorrow.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function NBANextLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nextDate = getNextSlateDate();

  return (
    <>
      {children}
    </>
  );
}