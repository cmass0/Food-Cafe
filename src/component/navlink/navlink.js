import { usePathname } from "next/navigation";
import Link from "next/link";
import style from "./navlink.module.css";

export default function NavLink({ href, children }) {
  const path = usePathname();

  return (
    <>
      <Link
        href={href}
        className={
          path.startsWith(href) ? `${style.active} ${style.link}` : style.link
        }
      >
        {children}
      </Link>
    </>
  );
}
