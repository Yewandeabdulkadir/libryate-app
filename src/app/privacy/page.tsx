import Link from "next/link";

export const metadata = { title: "Privacy notice" };

// PLACEHOLDER. The final wording must be written or approved by Libryate's lawyer / Data
// Protection Officer to meet the Nigeria Data Protection Act 2023 (US29).
export default function Privacy() {
  return (
    <main className="wrap fscreen">
      <Link className="back" href="/signup">
        ‹ Back
      </Link>
      <h1 className="fh">Privacy notice</h1>
      <p className="assume">Draft placeholder. Final wording to be approved before launch.</p>
      <div className="stack">
        <p>
          Libryate collects your name, email, and optionally your institution, course and level, so that we can run your
          account and show you relevant books. We record when you agreed to this notice.
        </p>
        <p>
          We record what you read and for how long, so that authors can be paid fairly. We do not sell your personal data.
        </p>
        <p>
          Under the Nigeria Data Protection Act 2023 you can ask to see, correct or delete your data at any time by contacting
          Libryate support.
        </p>
      </div>
    </main>
  );
}
