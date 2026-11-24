import { signOut } from "../(auth)/actions";

export const metadata = { title: "Account suspended" };

export default function Suspended() {
  return (
    <main className="wrap fscreen">
      <h1 className="fh">Your account is suspended</h1>
      <p className="fsub">
        An administrator has paused this account. Your notes and shelf are kept. Please contact Libryate support to have it
        reactivated.
      </p>
      <form action={signOut}>
        <button className="btn ghost block" type="submit">
          Log out
        </button>
      </form>
    </main>
  );
}
