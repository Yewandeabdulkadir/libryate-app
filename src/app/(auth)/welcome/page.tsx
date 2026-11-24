import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Welcome" };

export default function Welcome() {
  return (
    <>
      <section className="hero">
        <Logo size={26} />
        <h1 style={{ color: "#fff" }}>Your library on the go</h1>
        <p>Every recommended Law School text on your phone. Read, highlight and take notes, using little data.</p>
      </section>
      <div className="stack" style={{ marginTop: "auto" }}>
        <Link className="btn block" href="/signup">
          Create an account
        </Link>
        <Link className="btn ghost block" href="/login">
          Log in
        </Link>
        <p className="small muted" style={{ textAlign: "center" }}>
          Are you an author? <Link href="/signup?role=author">Join as an author</Link>
        </p>
      </div>
    </>
  );
}
