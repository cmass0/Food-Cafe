interface UserAvatarProps {
  name: string | null;
  avatarUrl: string | null;
}

export default function UserAvatar({ name, avatarUrl }: UserAvatarProps) {
  return (
    <div className="flex items-center gap-3">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={name ?? "avatar"} className="h-12 w-12 rounded-full object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/10 text-lg font-semibold">
          {(name ?? "?").slice(0, 1)}
        </div>
      )}
      <div className="text-sm font-medium">{name ?? "이름 없음"}</div>
    </div>
  );
}