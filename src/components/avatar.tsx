function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type AvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
};

export function Avatar({ name, avatarUrl, size = 64 }: AvatarProps) {
  const style = { width: size, height: size };

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        style={style}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <div
      style={style}
      className="flex items-center justify-center rounded-full bg-violet-100 text-lg font-semibold text-violet-700"
    >
      {initials(name) || "?"}
    </div>
  );
}
